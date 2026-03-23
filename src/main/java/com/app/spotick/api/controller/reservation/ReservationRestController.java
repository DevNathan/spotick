package com.app.spotick.api.controller.reservation;

import com.app.spotick.api.response.DataResponse;
import com.app.spotick.api.response.MessageResponse;
import com.app.spotick.api.response.PageResponse;
import com.app.spotick.domain.dto.place.PlaceReservationListDto;
import com.app.spotick.domain.dto.place.reservation.ReservationRequestListDto;
import com.app.spotick.domain.dto.user.UserDetailsDto;
import com.app.spotick.domain.pagination.Pagination;
import com.app.spotick.domain.type.place.PlaceReservationStatus;
import com.app.spotick.global.util.type.PlaceReservationSortType;
import com.app.spotick.service.place.reservation.PlaceReservationService;
import com.app.spotick.service.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reservation/api")
@RequiredArgsConstructor
@Slf4j
public class ReservationRestController {
    private final PlaceReservationService placeReservationService;
    private final UserService userService;

    @GetMapping("/places")
    public ResponseEntity<PageResponse<PlaceReservationListDto>> getUserReservations(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "sort", defaultValue = "UPCOMING") PlaceReservationSortType sortType,
            @AuthenticationPrincipal UserDetailsDto userDetailsDto) {

        try {
            Pageable pageable = PageRequest.of(page - 1, 6);

            Page<PlaceReservationListDto> reservations = userService.findReservationsByUserId(userDetailsDto.getId(), pageable, sortType);
            Pagination<PlaceReservationListDto> pagination = new Pagination<>(5, pageable, reservations);

            PageResponse<PlaceReservationListDto> response = new PageResponse<>(reservations, pagination);

            System.out.println("response = " + response);

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("유저 예약내역 조회 [Err_Msg]: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/getList/{placeId}")
    public ResponseEntity<Slice<ReservationRequestListDto>> getReservationsOfPlace(@PathVariable("placeId") Long placeId,
                                                                                   @RequestParam(name = "page", defaultValue = "0") int page,
                                                                                   @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        // placeId 검증은 없으면 요청 자체를 할 수 없으므로 검증은 무의미 할 것으로 판단.
        // placeId와 userId를 통해 place의 주인을 쿼리에서 검증해내므로 결과는 거기서 판단될 것.

        Pageable pageable = PageRequest.of(page, 10);

        Slice<ReservationRequestListDto> contentsSlice = placeReservationService.getReservationsOfPlace(placeId, userDetailsDto.getId(), pageable);

        return ResponseEntity.ok(contentsSlice);
    }

    @PatchMapping("/approve/{reservationId}")
    public ResponseEntity<MessageResponse> approveReservation(@PathVariable("reservationId") Long reservationId,
                                                              @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        try {
            placeReservationService.updateReservationStatusAsHost(
                    reservationId,
                    userDetailsDto.getId(),
                    PlaceReservationStatus.WAITING_PAYMENT // 결제를 할 수 있도록 승인 하는 것이 우선, 결제 이후 승인이 됨
            );
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(true)
                    .message("예약 요청을 승인했습니다.")
                    .build(), HttpStatus.OK
            );
        } catch (Exception e) {
            log.error("rId: {}, uId: {}, 호스트 예약 승인 [Err_Msg]: {}", reservationId, userDetailsDto.getId(), e.getMessage());
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build(), HttpStatus.BAD_REQUEST
            );
        }
    }

    @PatchMapping("/reject/{reservationId}")
    public ResponseEntity<MessageResponse> rejectReservation(@PathVariable("reservationId") Long reservationId,
                                                    @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        try {
            placeReservationService.updateReservationStatusAsHost(
                    reservationId,
                    userDetailsDto.getId(),
                    PlaceReservationStatus.REJECTED
            );
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(true)
                    .message("예약 요청을 거절했습니다.")
                    .build(), HttpStatus.OK
            );
        } catch (Exception e) {
            log.error("rId: {}, uId: {}, 호스트 예약 거절 [Err_Msg]: {}", reservationId, userDetailsDto.getId(), e.getMessage());
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build(), HttpStatus.BAD_REQUEST
            );
        }
    }

    @PatchMapping("/cancel/{reservationId}")
    public ResponseEntity<DataResponse<?>> cancelReservation(@PathVariable("reservationId") Long reservationId,
                                                             @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        try {
            String returnLog = placeReservationService
                    .updateReservationStatusAsUser(reservationId, userDetailsDto.getId(), PlaceReservationStatus.CANCELLED);

            return new ResponseEntity<>(DataResponse.builder()
                    .success(true)
                    .data(PlaceReservationStatus.CANCELLED.getDisplayName())
                    .message(returnLog)
                    .build(), HttpStatus.OK);
        } catch (Exception e) {
            log.error("rId: {}, uId: {}, 유저 예약 내역 취소 [Err_Msg]: {}", reservationId, userDetailsDto.getId(), e.getMessage());
            return new ResponseEntity<>(DataResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build(), HttpStatus.BAD_REQUEST);
        }
    }

    @PatchMapping("/delete/{reservationId}")
    public ResponseEntity<DataResponse<?>> deleteReservation(@PathVariable("reservationId") Long reservationId,
                                                             @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        try {
            String returnLog = placeReservationService
                    .updateReservationStatusAsUser(reservationId, userDetailsDto.getId(), PlaceReservationStatus.DELETED);
            return new ResponseEntity<>(DataResponse.builder()
                    .success(true)
                    .data(PlaceReservationStatus.CANCELLED.getDisplayName())
                    .message(returnLog)
                    .build(), HttpStatus.OK);
        } catch (Exception e) {
            log.error("유저 예약 내역 삭제 [Err_Msg]: {}", e.getMessage());
            return new ResponseEntity<>(DataResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build(), HttpStatus.BAD_REQUEST);
        }
    }
}
