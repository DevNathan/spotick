package com.app.spotick.repository.place.reservation;

import com.app.spotick.domain.dto.place.PlaceReservationListDto;
import com.app.spotick.domain.dto.place.reservation.ReservationRequestListDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

public interface PlaceReservationQDSLRepository {
    Page<PlaceReservationListDto> findReservationsByUserId(Long userId, Pageable pageable);

    Slice<ReservationRequestListDto> findReservationsByPlaceIdAndUserIdSlice(Long placeId, Long userId, Pageable pageable);

//    boolean isValidReservation(Long placeId, LocalDateTime checkIn, LocalDateTime checkOut);
}
