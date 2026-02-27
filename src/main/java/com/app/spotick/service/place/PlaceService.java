package com.app.spotick.service.place;

import com.app.spotick.domain.dto.place.*;
import com.app.spotick.domain.dto.place.PlaceEditDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReserveBasicInfoDto;
import com.app.spotick.global.util.search.DistrictFilter;
import com.app.spotick.global.util.type.PlaceSortType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.io.IOException;
import java.util.Optional;

public interface PlaceService {

    void registerPlace(PlaceRegisterDto placeRegisterDto,Long userId) throws IOException;

    Slice<PlaceListDto> newFindPlaceListPagination(Pageable pageable, Long userId, PlaceSortType sortType, DistrictFilter districtFilter, String keyword);

    PlaceDetailDto findPlaceDetailById(Long placeId,Long userId);

    PlaceReserveBasicInfoDto findPlaceReserveDefaultInfo(Long placeId);

    void disablePlaceService(Long placeId, Long userId);

    void reopenPlaceService(Long placeId, Long userId);

    void softDeletePlace(Long placeId, Long userId);

    Optional<PlaceEditDto> findPlaceInfo(Long placeId, Long userId);

    void updatePlace(PlaceEditDto placeEditDto, Long userId) throws IOException;
}
