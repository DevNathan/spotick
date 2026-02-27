package com.app.spotick.api.controller.file;

import com.app.spotick.api.response.DataResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnailator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
public class FileController {

    @Value("${default.profileFileDir}")
    private String defaultUploadPath;

    @Value("${root.dir}")
    private String rootPath;

    @Value("${summernote.dir}")
    private String summernotePath;

    /*
     * 다중 파일 업로드를 처리합니다.
     * 최신 NIO API를 사용하여 OS에 독립적인 경로 처리를 적용하고 파일 처리 성능을 향상시켰습니다.
     */
    @PostMapping("/upload")
    public List<String> uploadFile(@RequestParam("uploadFile") List<MultipartFile> uploadFiles) {
        String datePath = getPath();
        Path uploadDirPath = Paths.get(rootPath, datePath).normalize();
        List<String> uuids = new ArrayList<>();

        try {
            if (Files.notExists(uploadDirPath)) {
                Files.createDirectories(uploadDirPath);
            }

            for (MultipartFile uploadFile : uploadFiles) {
                if (uploadFile.isEmpty()) continue;

                String uuid = UUID.randomUUID().toString();
                uuids.add(uuid);

                String originalName = uploadFile.getOriginalFilename();
                // 경로 조작 문자를 제거하여 안전한 파일명을 추출합니다.
                String fileName = StringUtils.cleanPath(originalName != null ? originalName : "");
                Path targetPath = uploadDirPath.resolve(uuid + "_" + fileName).normalize();

                uploadFile.transferTo(targetPath);

                // 이미지 파일인 경우 썸네일 생성 로직을 수행합니다.
                String contentType = uploadFile.getContentType();
                if (contentType != null && contentType.startsWith("image")) {
                    Path thumbnailPath = uploadDirPath.resolve("t_" + uuid + "_" + fileName).normalize();

                    // try-with-resources를 사용하여 스트림 누수를 완벽하게 방지합니다.
                    try (InputStream in = Files.newInputStream(targetPath);
                         OutputStream out = Files.newOutputStream(thumbnailPath)) {
                        Thumbnailator.createThumbnail(in, out, 200, 200);
                    }
                }
            }
        } catch (IOException e) {
            log.error("파일 업로드 중 서버 에러 발생: {}", e.getMessage());
            throw new RuntimeException("파일 업로드 처리에 실패하였습니다.", e);
        }

        return uuids;
    }

    /*
     * 일반 업로드 파일의 바이트 데이터를 반환합니다.
     */
    @GetMapping("/display")
    public byte[] display(@RequestParam("fileName") String fileName) throws IOException {
        return getFileBytesSafe(rootPath, fileName);
    }

    /*
     * 프로필 기본 이미지를 반환합니다.
     */
    @GetMapping("/default/display")
    public byte[] defaultDisplay(@RequestParam("fileName") String fileName) throws IOException {
        String safeFileName = StringUtils.cleanPath(fileName);
        ClassPathResource resource = new ClassPathResource(defaultUploadPath + safeFileName);

        if (!resource.exists()) {
            throw new FileNotFoundException("기본 이미지를 찾을 수 없습니다.");
        }
        return resource.getInputStream().readAllBytes();
    }

    /*
     * Summernote 에디터용 이미지를 반환합니다.
     */
    @GetMapping("/sum")
    public byte[] sumDisplay(@RequestParam("fileName") String fileName) throws IOException {
        return getFileBytesSafe(summernotePath, fileName);
    }

    /*
     * Summernote 에디터 본문에 삽입될 이미지를 업로드합니다.
     */
    @PostMapping("/summernote/upload")
    public ResponseEntity<?> uploadNoteFile(@RequestParam("uploadFile") MultipartFile uploadFile) {
        if (uploadFile.isEmpty()) {
            return new ResponseEntity<>(DataResponse.builder()
                    .success(false)
                    .message("업로드된 파일이 없습니다.")
                    .build(), HttpStatus.BAD_REQUEST);
        }

        String datePath = getPath();
        Path uploadDirPath = Paths.get(summernotePath, datePath).normalize();
        String uuid = UUID.randomUUID().toString();

        try {
            if (Files.notExists(uploadDirPath)) {
                Files.createDirectories(uploadDirPath);
            }

            String originalName = uploadFile.getOriginalFilename();
            String fileName = StringUtils.cleanPath(originalName != null ? originalName : "");
            Path targetPath = uploadDirPath.resolve(uuid + "_" + fileName).normalize();

            uploadFile.transferTo(targetPath);

            return new ResponseEntity<>(DataResponse.builder()
                    .success(true)
                    .message("에디터 이미지 업로드 성공")
                    .data(datePath + "/" + uuid + "_" + fileName)
                    .build(), HttpStatus.OK);

        } catch (IOException e) {
            log.error("Summernote 이미지 업로드 중 에러 발생: {}", e.getMessage());
            throw new RuntimeException("에디터 이미지 업로드 처리에 실패하였습니다.", e);
        }
    }

    /*
     * 업로드 디렉토리를 연/월/일로 구분하기 위한 문자열을 생성합니다.
     */
    private String getPath() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
    }

    /*
     * Directory Traversal 보안 취약점을 완벽하게 방어하며 파일 데이터를 읽어옵니다.
     */
    private byte[] getFileBytesSafe(String basePath, String fileName) throws IOException {
        Path baseDirPath = Paths.get(basePath).normalize();
        // 전달받은 파일명에 포함된 악의적인 경로(..)를 해석하여 최종 경로를 계산합니다.
        Path targetPath = baseDirPath.resolve(fileName).normalize();

        // 보안 검증: 해석된 최종 경로가 반드시 허용된 기본 디렉토리의 하위에 위치하는지 확인합니다.
        if (!targetPath.startsWith(baseDirPath)) {
            log.warn("허가되지 않은 경로 접근 시도: {}", targetPath);
            throw new SecurityException("잘못된 파일 접근 시도입니다.");
        }

        if (Files.notExists(targetPath)) {
            throw new FileNotFoundException("요청하신 파일을 찾을 수 없습니다: " + fileName);
        }

        return Files.readAllBytes(targetPath);
    }
}