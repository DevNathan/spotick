package com.app.spotick.api.controller.place;

import com.app.spotick.api.response.MessageResponse;
import com.app.spotick.domain.dto.place.PlaceListDto;
import com.app.spotick.domain.dto.user.UserDetailsDto;
import com.app.spotick.global.util.search.DistrictFilter;
import com.app.spotick.global.util.type.PlaceSortType;
import com.app.spotick.service.place.PlaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/place/api")
@RequiredArgsConstructor
@Slf4j
public class PlaceRestController {
    private final PlaceService placeService;

    @GetMapping("/list")
    public ResponseEntity<Slice<PlaceListDto>> placeList(
            @RequestParam("page") int page,
            @RequestParam(name = "sort", defaultValue = "POPULARITY") PlaceSortType sortType,
            @RequestParam(value = "region", required = false) String region,
            @RequestParam(value = "district", required = false) List<String> district,
            @RequestParam(name = "keyword", required = false) String keyword,
            @AuthenticationPrincipal UserDetailsDto userDetailsDto
    ) {
        Pageable pageable = PageRequest.of(page, 12);
        Long userId = userDetailsDto == null ? null : userDetailsDto.getId();

        DistrictFilter districtFilter = new DistrictFilter(region, district);

        Slice<PlaceListDto> placeList = placeService.newFindPlaceListPagination(pageable, userId, sortType, districtFilter, keyword);

        return ResponseEntity.ok(placeList);
    }

    @PatchMapping("/disable/{placeId}")
    public ResponseEntity<MessageResponse> disablePlace(@PathVariable("placeId") Long placeId,
                                                        @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        try {
            placeService.disablePlaceService(placeId, userDetailsDto.getId());
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(true)
                    .message("해당 장소를 비활성화시켰습니다.")
                    .build(), HttpStatus.OK
            );
        } catch (Exception e) {
            log.error("pId: {}, uId: {}, 장소 비활성화 [Err_Msg]: {}", placeId, userDetailsDto.getId(), e.getMessage());
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build(), HttpStatus.BAD_REQUEST
            );
        }
    }

    @PatchMapping("/approve/{placeId}")
    public ResponseEntity<MessageResponse> enablePlace(@PathVariable("placeId") Long placeId,
                                                       @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        try {
            placeService.reopenPlaceService(placeId, userDetailsDto.getId());
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(true)
                    .message("해당 장소를 활성화시켰습니다. 이제부터 대여가 가능합니다.")
                    .build(), HttpStatus.OK
            );
        } catch (Exception e) {
            log.error("pId: {}, uId: {}, 장소 서비스 재개 [Err_Msg]: {}", placeId, userDetailsDto.getId(), e.getMessage());
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build(), HttpStatus.BAD_REQUEST
            );
        }
    }

    @DeleteMapping("/delete/{placeId}")
    public ResponseEntity<MessageResponse> softDeletePlace(@PathVariable("placeId") Long placeId,
                                                           @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        try {
            placeService.softDeletePlace(placeId, userDetailsDto.getId());
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(true)
                    .message("해당 장소를 삭제시켰습니다.")
                    .build(), HttpStatus.OK
            );
        } catch (Exception e) {
            log.error("pId: {}, uId: {}, 장소 소프트딜리트 [Err_Msg]: {}", placeId, userDetailsDto.getId(), e.getMessage());
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build(), HttpStatus.BAD_REQUEST
            );
        }
    }
}
