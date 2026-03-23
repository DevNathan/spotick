import $ from "jquery";

/**
 * 예약 관련 API 통신을 담당하는 서비스 모듈입니다.
 */
export const reservationService = (() => {
  /**
   * 예약을 취소합니다.
   * @param {number | string} reservationId 예약 식별자
   * @returns {JQuery.jqXHR} 취소 처리 결과에 대한 Promise 객체
   */
  const cancelReservation = (reservationId: number | string): JQuery.jqXHR => {
    return $.ajax({
      url: `/reservation/api/cancel/${reservationId}`,
      type: "PATCH",
      dataType: "json",
    });
  };

  /**
   * 예약 내역을 삭제합니다.
   * @param {number | string} reservationId 예약 식별자
   * @returns {JQuery.jqXHR} 삭제 처리 결과에 대한 Promise 객체
   */
  const deleteReservation = (reservationId: number | string): JQuery.jqXHR => {
    return $.ajax({
      url: `/reservation/api/delete/${reservationId}`,
      type: "PATCH",
      dataType: "json",
    });
  };

  /**
   * 장소의 예약 리스트를 조회합니다.
   * @param {number | string} placeId 장소 식별자
   * @param {number} page 조회할 페이지 번호
   * @param {Function} [callback] 성공 시 실행할 콜백 함수
   * @returns {JQuery.jqXHR} 예약 리스트 데이터에 대한 Promise 객체
   */
  const getList = (
    placeId: number | string,
    page: number,
    callback?: (data: any) => void,
  ): JQuery.jqXHR => {
    return $.ajax({
      url: `/reservation/api/getList/${placeId}?page=${page}`,
      type: "GET",
      dataType: "json",
    }).done((data) => {
      if (callback) {
        callback(data);
      }
    });
  };

  /**
   * 예약을 승인합니다.
   * @param {number | string} reservationId 예약 식별자
   * @returns {JQuery.jqXHR} 승인 처리 결과에 대한 Promise 객체
   */
  const approveReservation = (reservationId: number | string): JQuery.jqXHR => {
    return $.ajax({
      url: `/reservation/api/approve/${reservationId}`,
      type: "PATCH",
      dataType: "json",
    });
  };

  /**
   * 예약을 거절합니다.
   * @param {number | string} reservationId 예약 식별자
   * @returns {JQuery.jqXHR} 거절 처리 결과에 대한 Promise 객체
   */
  const rejectReservation = (reservationId: number | string): JQuery.jqXHR => {
    return $.ajax({
      url: `/reservation/api/reject/${reservationId}`,
      type: "PATCH",
      dataType: "json",
    });
  };

  /**
   * 사용자의 예약 내역을 조회합니다.
   * @param {number} page 조회할 페이지 번호
   * @param {string} sort 정렬 조건
   * @returns {JQuery.jqXHR} 사용자 예약 내역 데이터에 대한 Promise 객체
   */
  const getReservationsOfUser = (page: number, sort: string): JQuery.jqXHR => {
    return $.ajax({
      url: `/reservation/api/places?page=${page}&sort=${sort}`,
      type: "GET",
      dataType: "json",
    });
  };

  return {
    cancelReservation,
    deleteReservation,
    getList,
    approveReservation,
    rejectReservation,
    getReservationsOfUser,
  };
})();
