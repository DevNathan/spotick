package com.app.spotick.service.bootpay;

import com.app.spotick.api.response.BootPayResponse;
import com.app.spotick.domain.entity.place.PlacePayment;
import com.app.spotick.domain.entity.place.PlaceReservation;
import com.app.spotick.domain.entity.ticket.TicketOrder;
import com.app.spotick.domain.type.payment.PaymentStatus;
import com.app.spotick.domain.type.payment.PaymentType;
import com.app.spotick.domain.type.place.PlaceReservationStatus;
import com.app.spotick.repository.place.payment.PlacePaymentRepository;
import com.app.spotick.repository.ticket.order.TicketOrderRepository;
import kr.co.bootpay.pg.Bootpay;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.NoSuchElementException;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class BootpayService {

    private final Bootpay bootpay;
    private final PlacePaymentRepository placePaymentRepository;
    private final TicketOrderRepository ticketOrderRepository;

    /*
     * 영수증 ID를 통해 Bootpay 서버에서 결제 내역을 단건 조회합니다.
     */
    public HashMap<String, Object> getBootpayReceipt(String receiptId) {
        try {
            return bootpay.getReceipt(receiptId);
        } catch (Exception e) {
            log.error("Bootpay 영수증 확인 실패, [Err_Msg]: {}", e.getMessage());
            return null;
        }
    }

    /*
     * 결제 승인을 요청하고 성공 시 내부 데이터베이스의 결제 상태를 승인으로 변경합니다.
     */
    private HashMap<String, Object> confirm(String receiptId, PaymentType paymentType) {
        try {
            HashMap<String, Object> res = bootpay.confirm(receiptId);

            if (res.get("error_code") == null) {
                log.info("Bootpay 결제 승인 성공: {}", res);
                Long orderId = Long.valueOf(res.get("order_id").toString());

                if (paymentType == PaymentType.PLACE) {
                    PlacePayment foundPayment = placePaymentRepository.findById(orderId)
                            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 장소 결제 내역입니다."));
                    foundPayment.updatePaymentStatus(PaymentStatus.APPROVED);

                    PlaceReservation foundReservation = placePaymentRepository.findReservationByPaymentId(orderId);
                    foundReservation.updateStatus(PlaceReservationStatus.APPROVED);

                } else if (paymentType == PaymentType.TICKET) {
                    TicketOrder foundOrder = ticketOrderRepository.findById(orderId)
                            .orElseThrow(() -> new NoSuchElementException("존재하지 않는 티켓 주문 내역입니다."));
                    foundOrder.updatePaymentStatus(PaymentStatus.APPROVED);
                }
            } else {
                log.warn("Bootpay 결제 승인 거절: {}", res);
            }
            return res;
        } catch (Exception e) {
            log.error("결제 승인 과정 중 오류 발생 [Err_Msg]: {}", e.getMessage());
            return null;
        }
    }

    /*
     * 결제 검증 실패 시 데이터베이스의 결제 상태를 거절로 변경합니다.
     */
    private void deny(String orderId, PaymentType paymentType) {
        if (paymentType == PaymentType.PLACE) {
            PlacePayment foundPayment = placePaymentRepository.findById(Long.valueOf(orderId))
                    .orElseThrow(() -> new NoSuchElementException("존재하지 않는 장소 결제 내역입니다."));
            foundPayment.updatePaymentStatus(PaymentStatus.DECLINED);
        }
    }

    /*
     * Bootpay 영수증의 가격과 내부 데이터베이스의 주문 가격을 비교하여 결제의 유효성을 검증합니다.
     */
    public ResponseEntity<?> priceCheck(String orderId, PaymentType paymentType) {
        HashMap<String, Object> res = getBootpayReceipt(orderId);

        if (res == null || res.get("price") == null) {
            return buildErrorResponse("영수증을 정상적으로 불러오지 못했습니다.");
        }

        long receiptPrice = Long.parseLong(res.get("price").toString());
        Long fullPrice;

        if (paymentType == PaymentType.PLACE) {
            fullPrice = placePaymentRepository.findAmountById(Long.valueOf(res.get("order_id").toString()))
                    .orElseThrow(() -> new NoSuchElementException("결제 금액을 확인할 수 없습니다."));
        } else {
            fullPrice = ticketOrderRepository.findAmountById(Long.valueOf(res.get("order_id").toString()))
                    .orElseThrow(() -> new NoSuchElementException("결제 금액을 확인할 수 없습니다."));
        }

        if (receiptPrice == fullPrice) {
            HashMap<String, Object> confirmationData = confirm(orderId, paymentType);
            return new ResponseEntity<>(
                    BootPayResponse.builder()
                            .success(true)
                            .code(0)
                            .message("결제 성공")
                            .data(confirmationData)
                            .build(),
                    HttpStatus.OK
            );
        } else {
            deny(orderId, paymentType);
            return buildErrorResponse("결제 금액이 일치하지 않아 결제가 거부되었습니다.");
        }
    }

    /*
     * 공통 에러 응답 객체를 생성합니다.
     */
    private ResponseEntity<BootPayResponse> buildErrorResponse(String message) {
        return new ResponseEntity<>(
                BootPayResponse.builder()
                        .success(false)
                        .code(2)
                        .message(message)
                        .build(),
                HttpStatus.FORBIDDEN
        );
    }
}