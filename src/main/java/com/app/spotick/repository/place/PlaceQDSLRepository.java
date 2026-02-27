package com.app.spotick.repository.place;

import com.app.spotick.domain.dto.place.PlaceDetailDto;
import com.app.spotick.domain.dto.place.PlaceEditDto;
import com.app.spotick.domain.dto.place.PlaceListDto;
import com.app.spotick.domain.dto.place.PlaceManageListDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReserveBasicInfoDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReservedNotReviewedDto;
import com.app.spotick.domain.dto.place.review.ContractedPlaceDto;
import com.app.spotick.global.util.search.DistrictFilter;
import com.app.spotick.global.util.type.PlaceManagerSortType;
import com.app.spotick.global.util.type.PlaceSortType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.util.Optional;

public interface PlaceQDSLRepository {
    // 업데이트 버전 게시글 리스트
    Slice<PlaceListDto> findPlaceListPage(Pageable pageable, Long userId, PlaceSortType placeSortType, DistrictFilter districtFilter, String keyword);
    // 장소 상세보기
    Optional<PlaceDetailDto> findPlaceDetailById(Long placeId, Long userId);
    // 장소예약페이지에서  장소에대한 기본정보
    Optional<PlaceReserveBasicInfoDto> findPlaceReserveBasicInfo(Long placeId);

    Page<PlaceReservedNotReviewedDto> findPlaceListNotRelatedToReview(Long userId, Pageable pageable);

    Page<PlaceManageListDto> findHostPlaceListByUserId(Long userId, Pageable pageable, PlaceManagerSortType sortType);

    Optional<ContractedPlaceDto> findPlaceBriefly(Long placeId, Long userId);

    Optional<PlaceEditDto> findPlaceInfoByPlaceIdAndUserId(Long placeId, Long userId);

//    Slice<PlaceSearchListDto> findPlaceListByOptions(Pageable pageable, Long userId, PlaceSortType sortType, AreaFilter areaFilter, String keyword);
}
