package com.app.spotick.service.place.file;

import com.app.spotick.domain.entity.place.Place;
import com.app.spotick.domain.entity.place.PlaceFile;
import com.app.spotick.repository.place.file.PlaceFileRepository;
import lombok.RequiredArgsConstructor;
import net.coobird.thumbnailator.Thumbnailator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class PlaceFileServiceImpl implements PlaceFileService {
    private final PlaceFileRepository placeFileRepository;

    @Value("${root.dir}")
    private String ROOT_DIR;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void registerAndSavePlaceFile(List<MultipartFile> placeFiles, Place place) throws IOException {
        for (MultipartFile file : placeFiles) {
            if (file.isEmpty()) continue;
            PlaceFile placeFile = saveFile(file);
            placeFile.setPlace(place);
            placeFileRepository.save(placeFile);
        }
    }

    private PlaceFile saveFile(MultipartFile placeFile) throws IOException {
        String originName = placeFile.getOriginalFilename();

        // Path Traversal 방어 로직
        if (originName != null) {
            originName = StringUtils.cleanPath(originName);
            if (originName.contains("..")) {
                throw new SecurityException("Path traversal attempt detected. Invalid file name.");
            }
        }

        String extension = "";
        if (originName != null && originName.contains(".")) {
            extension = originName.substring(originName.lastIndexOf("."));
        }

        // Linux 환경 InvalidPathException 방지를 위한 안전한 파일명 치환
        String safeFileName = UUID.randomUUID().toString().substring(0, 10) + extension;
        UUID uuid = UUID.randomUUID();
        String sysName = uuid + "_" + safeFileName;

        String datePath = getUploadPath();
        Path uploadDirPath = Paths.get(ROOT_DIR, datePath).normalize();

        // NIO.2 기반 디렉토리 생성
        if (Files.notExists(uploadDirPath)) {
            Files.createDirectories(uploadDirPath);
        }

        Path targetPath = uploadDirPath.resolve(sysName).normalize();
        placeFile.transferTo(targetPath);

        // 이미지 파일인 경우 썸네일 생성
        String contentType = Files.probeContentType(targetPath);
        boolean isImage = contentType != null && contentType.startsWith("image");
        if (!isImage && extension.toLowerCase().matches("\\.(jpg|jpeg|png|webp|gif)$")) {
            isImage = true;
        }

        if (isImage) {
            Path thumbnailPath = uploadDirPath.resolve("t_" + sysName).normalize();

            try {
                net.coobird.thumbnailator.Thumbnails.of(targetPath.toFile())
                        .size(300, 225)
                        .toFile(thumbnailPath.toFile());
            } catch (Exception e) {
                System.err.println("썸네일 처리 실패 (무시됨). 파일명: " + originName + " / 사유: " + e.getMessage());
            }
        }

        return PlaceFile.builder()
                .uuid(uuid.toString())
                .fileName(safeFileName)
                .uploadPath(datePath)
                .build();
    }

    private String getUploadPath() {
        return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
    }
}