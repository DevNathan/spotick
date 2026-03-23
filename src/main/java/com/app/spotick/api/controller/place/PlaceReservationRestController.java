package com.app.spotick.api.controller.place;

import com.app.spotick.domain.dto.place.reservation.PlaceReservationTimeDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReserveRegisterDto;
import com.app.spotick.domain.dto.user.UserDetailsDto;
import com.app.spotick.service.place.reservation.PlaceReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/reservations/*")
public class PlaceReservationRestController {
    private final PlaceReservationService reservationService;

    @PostMapping("/v1/availability/check")
    public ResponseEntity<Boolean> reservationCheck(@RequestBody PlaceReserveRegisterDto placeReserveRegisterDto){
        boolean reservationAvailable = !reservationService.isReservationAvailable(placeReserveRegisterDto);
        return ResponseEntity.ok(reservationAvailable);
    }

    @GetMapping("/v1/places/{placeId}/reserved-times")
    public ResponseEntity<List<PlaceReservationTimeDto>> findReservedTimes(@PathVariable("placeId")Long placeId,
                                                                           @RequestParam("reservationDate")String reservationDate){
        List<PlaceReservationTimeDto> reservedTimes = reservationService.findReservedTimes(placeId, reservationDate);
        return ResponseEntity.ok(reservedTimes);
    }

    @PostMapping("/v1/register")
    public ResponseEntity<Void> registerReservation(@RequestBody PlaceReserveRegisterDto placeReserveRegisterDto,
                                                    @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        reservationService.registerPlaceReservation(placeReserveRegisterDto, userDetailsDto.getId());
        return ResponseEntity.ok().build();
    }
}