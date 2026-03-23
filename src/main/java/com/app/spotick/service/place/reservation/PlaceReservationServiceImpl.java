package com.app.spotick.service.place.reservation;

import com.app.spotick.domain.dto.place.reservation.PlaceReservationTimeDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReserveRegisterDto;
import com.app.spotick.domain.dto.place.reservation.ReservationRequestListDto;
import com.app.spotick.domain.entity.place.Place;
import com.app.spotick.domain.entity.place.PlaceReservation;
import com.app.spotick.domain.entity.user.User;
import com.app.spotick.domain.type.place.PlaceReservationStatus;
import com.app.spotick.repository.place.PlaceRepository;
import com.app.spotick.repository.place.reservation.PlaceReservationRepository;
import com.app.spotick.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
@RequiredArgsConstructor
public class PlaceReservationServiceImpl implements PlaceReservationService {
    private final UserRepository userRepository;
    private final PlaceRepository placeRepository;
    private final PlaceReservationRepository placeReservationRepository;

    @Override
    public PlaceReservation findReservationByIdAndUser(Long reservationId, Long userId) {
        User tmpUser = userRepository.getReferenceById(userId);

        return placeReservationRepository.findByIdAndUser(reservationId, tmpUser).orElseThrow(
                () -> new NoSuchElementException("예약내역을 찾을 수 없습니다.")
        );
    }

    @Override
    public void cancelReservation(Long reservationId) {
        PlaceReservation foundReservation = placeReservationRepository.findById(reservationId).orElseThrow(
                NoSuchElementException::new
        );
        foundReservation.updateStatus(PlaceReservationStatus.CANCELLED);
    }

    @Override
    public void deleteReservation(Long reservationId) {
        PlaceReservation foundReservation = placeReservationRepository.findById(reservationId).orElseThrow(
                NoSuchElementException::new
        );

        placeReservationRepository.delete(foundReservation);
    }

    @Override
    public void registerPlaceReservation(PlaceReserveRegisterDto placeReserveRegisterDto, Long userId) {
        User userProxy = userRepository.getReferenceById(userId);

        // 금액 계산을 위해 프록시가 아닌 실제 Place 엔티티를 조회한다.
        Place place = placeRepository.findById(placeReserveRegisterDto.getPlaceId())
                .orElseThrow(() -> new NoSuchElementException("장소 정보를 찾을 수 없습니다."));

        LocalDateTime checkIn = parseToLocalDateTime(placeReserveRegisterDto.getReservationCheckIn());
        LocalDateTime checkOut = parseToLocalDateTime(placeReserveRegisterDto.getReservationCheckOut());

        // 1. 이용 시간 계산 (Hours)
        long usageHours = java.time.Duration.between(checkIn, checkOut).toHours();
        if (usageHours <= 0) {
            throw new IllegalArgumentException("예약 시간 설정이 올바르지 않습니다.");
        }

        // 2. 추가 인원 계산 (기본 인원 초과 시)
        int visitors = placeReserveRegisterDto.getReservationVisitors();
        int extraPeople = Math.max(0, visitors - place.getDefaultPeople());

        // 3. 최종 금액 계산: (기본요금 + (추가인원 * 추가요금)) * 이용시간
        int calculatedAmount = (int) ((place.getPrice() + (extraPeople * place.getSurcharge())) * usageHours);

        placeReservationRepository.save(PlaceReservation.builder()
                .place(place)
                .user(userProxy)
                .checkIn(checkIn)
                .checkOut(checkOut)
                .content(placeReserveRegisterDto.getReservationContent())
                .amount(calculatedAmount) // 프론트엔드 값이 아닌 서버에서 계산한 절대적인 금액을 주입
                .visitors(visitors)
                .reservationStatus(PlaceReservationStatus.PENDING)
                .notReviewing(false)
                .build());
    }

    @Override
    public boolean isReservationAvailable(PlaceReserveRegisterDto placeReserveRegisterDto) {
        LocalDateTime checkIn = parseToLocalDateTime(placeReserveRegisterDto.getReservationCheckIn());
        LocalDateTime checkOut = parseToLocalDateTime(placeReserveRegisterDto.getReservationCheckOut());
        return !placeReservationRepository
                .isOverlappingReservation(placeReserveRegisterDto.getPlaceId(), checkIn, checkOut);
    }

    @Override
    public void updateNotReviewing(Long reservationId, Long userId) {
        User tmpUser = userRepository.getReferenceById(userId);
        PlaceReservation foundReservation = placeReservationRepository.findByIdAndUser(reservationId, tmpUser).orElseThrow(
                () -> new NoSuchElementException("기존의 예약 정보를 찾을 수 없습니다.")
        );
        foundReservation.updateNotReviewing(true);
    }

    private LocalDateTime parseToLocalDateTime(String dateString) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return LocalDateTime.parse(dateString, formatter);
    }

    @Override
    public List<PlaceReservationTimeDto> findReservedTimes(Long placeId, String selectedDate) {

        LocalDateTime startTime = parseToLocalDateTime(selectedDate + " 00:00:00");
        LocalDateTime endTime = startTime.plusDays(1).plusHours(23);
        return placeReservationRepository.findReservedTimes(placeId, startTime, endTime);
    }

    @Override
    public Slice<ReservationRequestListDto> getReservationsOfPlace(Long placeId, Long userId, Pageable pageable) {
        return placeReservationRepository.findReservationsByPlaceIdAndUserIdSlice(placeId, userId, pageable);
    }

    @Override
    public void updateReservationStatusAsHost(Long reservationId, Long userId, PlaceReservationStatus status) {
        PlaceReservation foundReservation = placeReservationRepository.findByIdAndHost(reservationId, userId).orElseThrow(
                () -> new NoSuchElementException("예약내역을 찾을 수 없습니다.")
        );

        foundReservation.updateStatus(status);
    }

    @Override
    public String updateReservationStatusAsUser(Long reservationId, Long userId, PlaceReservationStatus status) {
        String returnLog = "";

        User tmpUser = userRepository.getReferenceById(userId);

        PlaceReservation foundReservation = placeReservationRepository.findByIdAndUser(reservationId, tmpUser).orElseThrow(() ->
                new NoSuchElementException("예약 내역을 찾을 수 없습니다.")
        );

        switch (status) {
            case CANCELLED -> {
                if (foundReservation.getCheckIn().isBefore(LocalDateTime.now())) {
                    // checkIn시간이 현재 시간보다 이전일 경우, 이미 승인된 예약일 경우
                    throw new IllegalArgumentException("예약 시간이 지나간 예약은 취소할 수 없습니다.");
                }
                if (foundReservation.getReservationStatus().equals(PlaceReservationStatus.APPROVED)) {
                    // 승인된 예약은 취소 불가
                    throw new IllegalArgumentException("이미 승인된 예약은 취소할 수 없습니다.");
                }

                returnLog = "예약이 취소되었습니다.";
            }

            case DELETED -> {
                if (foundReservation.getReservationStatus() != PlaceReservationStatus.CANCELLED) {
                    // 캔슬 된 경우가 아니라면 아래 과정을 거쳐야 함
                    if (foundReservation.getCheckOut().isAfter(LocalDateTime.now())) {
                        // checkIn시간이 현재 시간보다 이전일 경우, 이미 승인된 예약일 경우
                        throw new IllegalArgumentException("예약시간이 지나지 않은 예약은<br>삭제할 수 없습니다.");
                    }
                }

                if (foundReservation.getReservationStatus().equals(PlaceReservationStatus.PENDING)
                    || foundReservation.getReservationStatus().equals(PlaceReservationStatus.WAITING_PAYMENT)) {
                    // 예약이 해지되지 못하고 유효한 상태일 시 삭제불가
                    throw new IllegalArgumentException("예약이 해지되어있지 않습니다.<br>예약을 취소하고 삭제를 시도하여주십시오.");
                }

                returnLog = "예약 내역이 삭제되었습니다.";
            }

        }

        foundReservation.updateStatus(status);
        return returnLog;
    }
}













