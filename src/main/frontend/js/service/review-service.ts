import $ from "jquery";

/**
 * 후기 관련 API 통신을 담당하는 서비스 모듈입니다.
 */
export const reviewService = (() => {
  /**
   * 후기를 등록합니다.
   * @param {number | string} reservationId 예약 식별자
   * @param {number} score 평점
   * @param {string} content 리뷰 내용
   * @returns {JQuery.jqXHR} 후기 등록 결과에 대한 Promise 객체
   */
  const registerReview = (
    reservationId: number | string,
    score: number,
    content: string,
  ): JQuery.jqXHR => {
    const reviewRegisterDto = {
      reservationId: reservationId,
      score: score,
      content: content,
    };

    return $.ajax({
      url: "/reviews/api/write",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(reviewRegisterDto),
      dataType: "json",
    });
  };

  /**
   * 후기 작성을 취소(작성 안함) 처리합니다.
   * @param {number | string} reservationId 예약 식별자
   * @returns {JQuery.jqXHR} 처리 결과에 대한 Promise 객체
   */
  const setNotReviewing = (reservationId: number | string): JQuery.jqXHR => {
    return $.ajax({
      url: `/reviews/api/notReviewing/${reservationId}`,
      type: "PATCH",
      dataType: "json",
    });
  };

  /**
   * 등록된 후기를 수정합니다.
   * @param {number | string} reviewId 후기 식별자
   * @param {number} score 수정할 평점
   * @param {string} content 수정할 내용
   * @returns {JQuery.jqXHR} 수정 결과에 대한 Promise 객체
   */
  const editReview = (
    reviewId: number | string,
    score: number,
    content: string,
  ): JQuery.jqXHR => {
    const placeReviewUpdateDto = {
      reviewId: reviewId,
      score: score,
      content: content,
    };

    return $.ajax({
      url: "/reviews/api/edit",
      type: "PUT",
      contentType: "application/json",
      data: JSON.stringify(placeReviewUpdateDto),
      dataType: "json",
    });
  };

  return {
    registerReview,
    setNotReviewing,
    editReview,
  };
})();
