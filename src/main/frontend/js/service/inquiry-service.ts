import $ from "jquery";

/**
 * 사용자 및 호스트의 문의(Inquiry) 내역을 관리하는 서비스 모듈입니다.
 * jQuery AJAX를 사용하여 서버와 비동기 통신을 수행합니다.
 */
export const inquiryService = (() => {
  /**
   * 사용자의 장소 문의 내역을 조회합니다.
   * @param {number} page - 조회할 페이지 번호
   * @returns {JQuery.jqXHR} 장소 문의 내역 데이터에 대한 Promise 객체
   */
  const getPlaceInquiriesOfUser = (page: number): JQuery.jqXHR => {
    return $.ajax({
      url: `/inquiries/api/places?page=${page}`,
      type: "GET",
      dataType: "json",
    });
  };

  /**
   * 사용자의 티켓 문의 내역을 조회합니다.
   * @param {number} page - 조회할 페이지 번호
   * @returns {JQuery.jqXHR} 티켓 문의 내역 데이터에 대한 Promise 객체
   */
  const getTicketInquiriesOfUser = (page: number): JQuery.jqXHR => {
    return $.ajax({
      url: `/inquiries/api/tickets?page=${page}`,
      type: "GET",
      dataType: "json",
    });
  };

  /**
   * 특정 장소 문의를 삭제합니다.
   * @param {number} inquiryId - 삭제할 문의의 고유 식별자
   * @returns {JQuery.jqXHR} 삭제 처리 결과에 대한 Promise 객체
   */
  const deletePlaceInquiry = (inquiryId: number): JQuery.jqXHR => {
    return $.ajax({
      url: `/inquiries/api/placeDelete/${inquiryId}`,
      type: "DELETE",
      dataType: "json",
    });
  };

  /**
   * 특정 티켓 문의를 삭제합니다.
   * @param {number} inquiryId - 삭제할 문의의 고유 식별자
   * @returns {JQuery.jqXHR} 삭제 처리 결과에 대한 Promise 객체
   */
  const deleteTicketInquiry = (inquiryId: number): JQuery.jqXHR => {
    return $.ajax({
      url: `/inquiries/api/ticketDelete/${inquiryId}`,
      type: "DELETE",
      dataType: "json",
    });
  };

  /**
   * 호스트가 관리하는 특정 장소의 문의 내역을 조회합니다.
   * @param {number} placeId - 장소의 고유 식별자
   * @param {number} page - 조회할 페이지 번호
   * @param {Function} [callback] - 데이터를 성공적으로 조회한 후 실행할 선택적 콜백 함수
   * @returns {JQuery.jqXHR} 장소 문의 내역 데이터에 대한 Promise 객체
   */
  const getPlaceInquiriesOfHost = (
    placeId: number,
    page: number,
    callback?: (data: any) => void,
  ): JQuery.jqXHR => {
    return $.ajax({
      url: `/inquiries/api/getPlace/${placeId}?page=${page}`,
      type: "GET",
      dataType: "json",
    }).done((data) => {
      if (callback) {
        callback(data);
      }
    });
  };

  /**
   * 호스트가 특정 장소 문의에 대한 답변을 작성합니다.
   * @param {number} placeId - 장소의 고유 식별자
   * @param {number} inquiryId - 답변할 문의의 고유 식별자
   * @param {string} response - 작성할 답변 내용
   * @returns {JQuery.jqXHR} 답변 처리 결과에 대한 Promise 객체
   */
  const responsePlaceInquiry = (
    placeId: number,
    inquiryId: number,
    response: string,
  ): JQuery.jqXHR => {
    const inquiryResponseDto = {
      id: placeId,
      inquiryId: inquiryId,
      response: response,
    };

    return $.ajax({
      url: `/inquiries/api/response-plin`,
      type: "PATCH",
      contentType: "application/json",
      data: JSON.stringify(inquiryResponseDto),
      dataType: "json",
    });
  };

  /**
   * 호스트가 관리하는 특정 티켓의 문의 내역을 조회합니다.
   * @param {number} ticketId - 티켓의 고유 식별자
   * @param {number} page - 조회할 페이지 번호
   * @param {Function} [callback] - 데이터를 성공적으로 조회한 후 실행할 선택적 콜백 함수
   * @returns {JQuery.jqXHR} 티켓 문의 내역 데이터에 대한 Promise 객체
   */
  const getTicketInquiriesOfHost = (
    ticketId: number,
    page: number,
    callback?: (data: any) => void,
  ): JQuery.jqXHR => {
    return $.ajax({
      url: `/inquiries/api/getTicket/${ticketId}?page=${page}`,
      type: "GET",
      dataType: "json",
    }).done((data) => {
      if (callback) {
        callback(data);
      }
    });
  };

  /**
   * 호스트가 특정 티켓 문의에 대한 답변을 작성합니다.
   * @param {number} ticketId - 티켓의 고유 식별자
   * @param {number} inquiryId - 답변할 문의의 고유 식별자
   * @param {string} response - 작성할 답변 내용
   * @returns {JQuery.jqXHR} 답변 처리 결과에 대한 Promise 객체
   */
  const responseTicketInquiry = (
    ticketId: number,
    inquiryId: number,
    response: string,
  ): JQuery.jqXHR => {
    const inquiryResponseDto = {
      id: ticketId,
      inquiryId: inquiryId,
      response: response,
    };

    return $.ajax({
      url: `/inquiries/api/responseTicketInquiry`,
      type: "PATCH",
      contentType: "application/json",
      data: JSON.stringify(inquiryResponseDto),
      dataType: "json",
    });
  };

  return {
    getPlaceInquiriesOfUser,
    getTicketInquiriesOfUser,
    deletePlaceInquiry,
    deleteTicketInquiry,
    getPlaceInquiriesOfHost,
    responsePlaceInquiry,
    getTicketInquiriesOfHost,
    responseTicketInquiry,
  };
})();
