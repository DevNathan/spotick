import Bootpay from "@bootpay/client-js";
import $ from "jquery";
import { alertModal } from "@/utils/alert";

export const payService = (() => {
  const PAY_METHOD = "DEBIT_CARD";

  /*
   * HTML 메타 태그에서 부트페이 자바스크립트 키를 동적으로 가져옵니다.
   * 키가 존재하지 않을 경우 에러를 발생시켜 결제 진행을 차단합니다.
   */
  const getBootpayKey = (): string => {
    const keyMeta = document.querySelector('meta[name="bootpay-key"]');
    const key = keyMeta?.getAttribute("content");
    if (!key) {
      throw new Error(
        "부트페이 자바스크립트 키를 찾을 수 없습니다. HTML 메타 태그 설정을 확인해주세요.",
      );
    }
    return key;
  };

  /**
   * 장소 결제 정보를 서버에 임시 저장합니다.
   * @param {string | number} reservationId 예약 식별자
   * @param {Function} [callback] 성공 시 실행할 콜백 함수
   */
  const requestPlacePaymentSave = (
    reservationId: string | number,
    callback?: (data: any) => void,
  ): void => {
    const dto = {
      save: {
        reservationId: reservationId,
        paymentMethod: PAY_METHOD,
      },
    };

    $.ajax({
      url: "/order/api/place/save",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(dto),
      dataType: "json",
    })
      .done((response) => {
        const responseData =
          response.data !== undefined ? response.data : response;
        if (callback) callback(responseData);
      })
      .fail((_xhr, _status, error) => {
        console.error("Error:", error);
        void alertModal.show({
          title: "오류",
          message: "결제 요청 중 문제가 발생했습니다.",
          type: "error",
        });
      });
  };

  /**
   * 티켓 결제 정보를 서버에 임시 저장합니다.
   * @param {string | number} ticketId 티켓 식별자
   * @param {string} eventDate 행사 날짜
   * @param {any[]} ticketOrderDetailDtoList 티켓 상세 정보 리스트
   * @param {Function} [callback] 성공 시 실행할 콜백 함수
   */
  const requestTicketPaymentSave = (
    ticketId: string | number,
    eventDate: string,
    ticketOrderDetailDtoList: any[],
    callback?: (data: any) => void,
  ): void => {
    const dto = {
      ticketId: ticketId,
      eventDate: eventDate,
      paymentMethod: PAY_METHOD,
      ticketOrderDetailDtoList: ticketOrderDetailDtoList,
    };

    $.ajax({
      url: "/order/api/ticket/save",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(dto),
      dataType: "json",
    })
      .done((response) => {
        const responseData =
          response.data !== undefined ? response.data : response;
        if (callback) callback(responseData);
      })
      .fail((_xhr, _status, error) => {
        console.error("Error:", error);

        void alertModal.show({
          title: "오류",
          message: "결제 요청 중 문제가 발생했습니다.",
          type: "error",
        });
      });
  };

  /**
   * 장소 결제를 부트페이로 진행합니다.
   * @param {any} data 결제에 필요한 데이터 객체
   */
  const payItem = async (data: any): Promise<void> => {
    console.log("장소 결제 서버 응답 데이터:", data);

    const paymentPrice = data.amount || data.price;
    const paymentOrderId = data.placePaymentId || data.orderId || data.id;

    if (!paymentPrice || paymentPrice < 100) {
      void alertModal.show({
        title: "결제 오류",
        message: "결제 금액 정보가 유효하지 않습니다. 데이터를 확인하세요.",
        type: "error",
      });
      return;
    }

    try {
      const jsKey = getBootpayKey();

      const response = await Bootpay.requestPayment({
        application_id: jsKey,
        price: paymentPrice,
        order_name: data.placeTitle || "장소 예약",
        order_id: paymentOrderId,
        pg: "나이스페이",
        method: "카드",
        tax_free: 0,
        user: {
          id: data.userId || "guest",
          username: data.nickname || "사용자",
          phone: data.tel || "01000000000",
          email: data.email || "test@spotick.com",
        },
        extra: {
          open_type: "iframe",
          card_quota: "0,2,3",
          escrow: false,
          separately_confirmed: true,
        },
      });

      switch (response.event) {
        case "confirm":
          $.ajax({
            url: `/bootpay/api/place/check?receiptId=${response.receipt_id}`,
            type: "GET",
            dataType: "json",
          })
            .done((result) => {
              if (result.code === 0) {
                Bootpay.destroy();
                alertModal
                  .show({ title: "성공", message: result.message })
                  .then(() => {
                    location.replace("/mypage/reservations");
                  });
              } else {
                alertModal.show({
                  title: "오류",
                  message: "결제 도중 오류가 발생했습니다. 다시 시도해주세요.",
                  type: "error",
                });
              }
            })
            .fail(() => {
              alertModal.show({
                title: "오류",
                message: "결제 확인 중 통신 오류가 발생했습니다.",
                type: "error",
              });
            });
          break;
        case "done":
          console.log("결제 완료", response);
          break;
      }
    } catch (e: any) {
      console.log(e.message);
      switch (e.event) {
        case "cancel":
          $.ajax({
            url: `/bootpay/api/place/reject?paymentId=${paymentOrderId}`,
            type: "PATCH",
          })
            .done(() =>
              alertModal.show({
                title: "취소",
                message: "결제가 취소되었습니다.",
              }),
            )
            .fail(() =>
              alertModal.show({
                title: "오류",
                message: "거부 처리에 실패했습니다.",
                type: "error",
              }),
            );
          break;
        case "error":
          $.ajax({
            url: `/bootpay/api/place/reject?paymentId=${paymentOrderId}`,
            type: "PATCH",
          })
            .done(() =>
              alertModal.show({
                title: "오류",
                message: "결제 오류가 발생하여 취소합니다.",
                type: "error",
              }),
            )
            .fail(() =>
              alertModal.show({
                title: "오류",
                message: "오류 처리 실패.",
                type: "error",
              }),
            );
          break;
      }
    }
  };

  /**
   * 티켓 결제를 부트페이로 진행합니다.
   * @param {any} data 결제에 필요한 데이터 객체
   */
  const payTickets = async (data: any): Promise<void> => {
    console.log("티켓 결제 서버 응답 데이터:", data);

    const paymentPrice = data.amount || data.price;
    const paymentOrderId = data.orderId || data.id;

    if (!paymentPrice || paymentPrice < 100) {
      void alertModal.show({
        title: "결제 오류",
        message: "결제 금액 정보가 유효하지 않습니다. 데이터를 확인하세요.",
        type: "error",
      });
      return;
    }

    try {
      const jsKey = getBootpayKey();

      const response = await Bootpay.requestPayment({
        application_id: jsKey,
        price: paymentPrice,
        order_name: data.ticketTitle || "티켓 결제",
        order_id: paymentOrderId,
        pg: "나이스페이",
        method: "카드",
        tax_free: 0,
        user: {
          id: data.userId || "guest",
          username: data.nickname || "사용자",
          phone: data.tel || "01000000000",
          email: data.email || "test@spotick.com",
        },
        items: data.bootpayItemDtoList || [],
        extra: {
          open_type: "iframe",
          card_quota: "0,2,3",
          escrow: false,
          separately_confirmed: true,
        },
      });

      switch (response.event) {
        case "confirm":
          $.ajax({
            url: `/bootpay/api/ticket/check?receiptId=${response.receipt_id}`,
            type: "GET",
            dataType: "json",
          })
            .done((result) => {
              if (result.code === 0) {
                Bootpay.destroy();
                alertModal
                  .show({ title: "성공", message: result.message })
                  .then(() => {
                    location.replace("/mypage/reservations");
                  });
              } else {
                alertModal.show({
                  title: "오류",
                  message: "결제 도중 오류가 발생했습니다. 다시 시도해주세요.",
                  type: "error",
                });
              }
            })
            .fail(() => {
              alertModal.show({
                title: "오류",
                message: "결제 확인 중 통신 오류가 발생했습니다.",
                type: "error",
              });
            });
          break;
        case "done":
          console.log("결제 완료", response);
          break;
      }
    } catch (e: any) {
      console.log(e.message);
      switch (e.event) {
        case "cancel":
          $.ajax({
            url: `/bootpay/api/ticket/reject?orderId=${paymentOrderId}`,
            type: "PATCH",
          })
            .done(() =>
              alertModal.show({
                title: "취소",
                message: "결제가 취소되었습니다.",
              }),
            )
            .fail(() =>
              alertModal.show({
                title: "오류",
                message: "거부 처리에 실패했습니다.",
                type: "error",
              }),
            );
          break;
        case "error":
          $.ajax({
            url: `/bootpay/api/ticket/reject?orderId=${paymentOrderId}`,
            type: "PATCH",
          })
            .done(() =>
              alertModal.show({
                title: "오류",
                message: "결제 오류가 발생하여 취소합니다.",
                type: "error",
              }),
            )
            .fail(() =>
              alertModal.show({
                title: "오류",
                message: "오류 처리 실패.",
                type: "error",
              }),
            );
          break;
      }
    }
  };

  return {
    requestPlacePaymentSave,
    requestTicketPaymentSave,
    payItem,
    payTickets,
  };
})();
