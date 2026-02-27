package com.app.spotick.service.place;

import com.app.spotick.domain.dto.place.PlaceDetailDto;
import com.app.spotick.domain.dto.place.PlaceEditDto;
import com.app.spotick.domain.dto.place.PlaceListDto;
import com.app.spotick.domain.dto.place.PlaceRegisterDto;
import com.app.spotick.domain.dto.place.file.PlaceFileDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReserveBasicInfoDto;
import com.app.spotick.domain.entity.place.Place;
import com.app.spotick.domain.entity.place.PlaceFile;
import com.app.spotick.domain.entity.place.PlaceModifyRequest;
import com.app.spotick.domain.entity.place.PlaceReservation;
import com.app.spotick.domain.entity.user.User;
import com.app.spotick.domain.type.place.PlaceReservationStatus;
import com.app.spotick.domain.type.post.PostModifyStatus;
import com.app.spotick.domain.type.post.PostStatus;
import com.app.spotick.global.util.search.DistrictFilter;
import com.app.spotick.global.util.type.PlaceSortType;
import com.app.spotick.repository.place.PlaceRepository;
import com.app.spotick.repository.place.file.PlaceFileRepository;
import com.app.spotick.repository.place.modifyRequest.PlaceModifyReqRepository;
import com.app.spotick.repository.place.reservation.PlaceReservationRepository;
import com.app.spotick.repository.user.UserRepository;
import com.app.spotick.service.place.file.PlaceFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class PlaceServiceImpl implements PlaceService {

    private final PlaceRepository placeRepository;
    private final PlaceFileRepository placeFileRepository;
    private final PlaceReservationRepository placeReservationRepository;
    private final UserRepository userRepository;
    private final PlaceFileService placeFileService;
    private final PlaceModifyReqRepository placeModifyReqRepository;

    @Override
    public void registerPlace(PlaceRegisterDto placeRegisterDto, Long userId) throws IOException {
        User host = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("존재하지 않는 회원"));
        Place place = placeRegisterDto.toEntity();
        place.setHost(host);

        place = placeRepository.save(place);
        List<MultipartFile> placeFiles = placeRegisterDto.getPlaceFiles();

        placeFileService.registerAndSavePlaceFile(placeFiles, place);
    }

    @Override
    @Transactional(readOnly = true)
    public Slice<PlaceListDto> newFindPlaceListPagination(Pageable pageable, Long userId, PlaceSortType sortType, DistrictFilter districtFilter, String keyword) {
        return placeRepository.findPlaceListPage(pageable, userId, sortType, districtFilter, keyword);
    }

    @Override
    public PlaceDetailDto findPlaceDetailById(Long placeId, Long userId) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new IllegalStateException("존재하지 않는 장소 게시글"));

        place.increaseViewCount();

        return placeRepository.findPlaceDetailById(placeId, userId)
                .orElseThrow(() -> new IllegalStateException("존재하지 않는 장소 게시글"));
    }

    @Override
    @Transactional(readOnly = true)
    public PlaceReserveBasicInfoDto findPlaceReserveDefaultInfo(Long placeId) {
        return placeRepository.findPlaceReserveBasicInfo(placeId)
                .orElseThrow(() -> new IllegalStateException("존재하지 않는 장소 게시글"));
    }

    @Override
    public void disablePlaceService(Long placeId, Long userId) {
        Place tmpPlace = placeRepository.getReferenceById(placeId);
        User tmpUser = userRepository.getReferenceById(userId);

        List<PlaceReservation> foundReservations = placeReservationRepository.findAllByPlaceAndUser(tmpPlace, tmpUser);

        foundReservations.forEach(
                reservation -> reservation.updateStatus(PlaceReservationStatus.REJECTED)
        );

        Place foundPlace = placeRepository.findByIdAndUser(placeId, tmpUser).orElseThrow(
                () -> new NoSuchElementException("장소 정보를 찾을 수 없습니다.")
        );

        if (foundPlace.getPlaceStatus() != PostStatus.APPROVED) {
            throw new IllegalArgumentException("해당 장소는 이미 활성화 되어있지 않습니다.");
        }

        foundPlace.updatePlaceStatus(PostStatus.DISABLED);
    }

    @Override
    public void reopenPlaceService(Long placeId, Long userId) {
        User tmpUser = userRepository.getReferenceById(userId);

        Place foundPlace = placeRepository.findByIdAndUser(placeId, tmpUser).orElseThrow(
                () -> new NoSuchElementException("장소 정보를 찾을 수 없습니다.")
        );

        if (foundPlace.getPlaceStatus() != PostStatus.DISABLED) {
            throw new IllegalArgumentException("비활성화된 장소만 활성화로 전환 할 수 있습니다.");
        }

        foundPlace.updatePlaceStatus(PostStatus.APPROVED);
    }

    @Override
    public void softDeletePlace(Long placeId, Long userId) {
        Place tmpPlace = placeRepository.getReferenceById(placeId);
        User tmpUser = userRepository.getReferenceById(userId);

        List<PlaceReservation> foundReservations = placeReservationRepository.findAllByPlaceAndUser(tmpPlace, tmpUser);

        foundReservations.forEach(
                reservation -> reservation.updateStatus(PlaceReservationStatus.REJECTED)
        );

        Place foundPlace = placeRepository.findByIdAndUser(placeId, tmpUser).orElseThrow(
                () -> new NoSuchElementException("장소 정보를 찾을 수 없습니다.")
        );

        foundPlace.updatePlaceStatus(PostStatus.DELETED);
    }

    @Override
    public Optional<PlaceEditDto> findPlaceInfo(Long placeId, Long userId) {
        return placeRepository.findPlaceInfoByPlaceIdAndUserId(placeId, userId);
    }

    @Override
    public void updatePlace(PlaceEditDto placeEditDto, Long userId) throws IOException {
        User tmpUser = userRepository.getReferenceById(userId);

        Place originalPlace = placeRepository.findByIdAndUser(placeEditDto.getPlaceId(), tmpUser).orElseThrow(
                NoSuchElementException::new
        );
        // 기존의 장소정보는 status만 교체한다.
        originalPlace.updatePlaceStatus(PostStatus.MODIFICATION_PENDING);

        // 업데이트된 장소정보는 통째로 새로 등록시킨다.
        Place updatedPlace = placeEditDto.toEntity();
        updatedPlace.setHost(tmpUser);

        Place changedPlace = placeRepository.save(updatedPlace);
        System.out.println("newPlace = " + changedPlace);

        // 새로 등록된 장소에 사진정보도 옮겨준다.
        List<PlaceFileDto> files = placeFileRepository.findPlaceFilesByPlaceIdNotFileIds(
                originalPlace.getId(),
                placeEditDto.getSaveFileIdList()
        );
        System.out.println("files = " + files);

        List<PlaceFile> copiedFiles = new ArrayList<>();
        files.forEach(file -> {
            PlaceFile copiedFile = file.toEntity();
            copiedFile.setId(null);
            copiedFile.setPlace(changedPlace);
            copiedFiles.add(copiedFile);
        });

        System.out.println("copiedFiles = " + copiedFiles);

        placeFileRepository.saveAll(copiedFiles);

        List<MultipartFile> placeFiles = placeEditDto.getPlaceNewFiles();
        // 새파일이 비어있지 않은 경우에만 처리
        if (placeFiles.stream().anyMatch(file -> file.getSize() > 0)) {
            System.out.println("placeFiles = " + placeFiles);
            placeFileService.registerAndSavePlaceFile(placeFiles, changedPlace);
        }

//        기존 장소와, 새로 업데이트될 장소를 등록 및 상태 수정 후 장소 수정신청 엔티티에 등록
        placeModifyReqRepository.save(PlaceModifyRequest.builder()
                .originalPlace(originalPlace)
                .changedPlace(changedPlace)
                .placeModifyStatus(PostModifyStatus.PENDING)
                .build());

    }
}















