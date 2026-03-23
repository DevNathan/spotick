import $ from "jquery";

/**
 * Confirm 모달의 구성 옵션을 정의하는 인터페이스입니다.
 */
export interface ConfirmOptions {
  /** Confirm 모달의 제목 (예: "정말 삭제하시겠습니까?") */
  title: string;
  /** Confirm 모달의 상세 내용 */
  message: string;
  /** 확인 버튼의 텍스트 (기본값: "확인") */
  confirmText?: string;
  /** 취소 버튼의 텍스트 (기본값: "취소") */
  cancelText?: string;
  /** * 확인 버튼의 목적(색상) 타입
   * - 'point': 일반적인 확인, 승인 (파란색 계열)
   * - 'destroy': 삭제, 취소 등 위험성을 띈 작업 (빨간색 계열)
   * (기본값: "point")
   */
  type?: "point" | "destroy";
}

/**
 * 전역으로 사용되는 커스텀 Confirm 모달 유틸리티입니다.
 */
export const confirmModal = {
  /**
   * Confirm 모달을 화면에 렌더링하고 사용자의 응답을 Promise로 반환합니다.
   * * @param options - Confirm 옵션 객체
   * @returns 사용자가 확인을 누르면 true, 취소를 누르거나 배경을 클릭하면 false를 반환하는 Promise
   */
  show: (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const {
        title,
        message,
        confirmText = "확인",
        cancelText = "취소",
        type = "point",
      } = options;

      // 이전 인스턴스가 존재할 경우 안전하게 제거
      $("#spotickConfirmOverlay").remove();

      const modalHtml = `
        <div class="spotick-confirm-overlay" id="spotickConfirmOverlay">
            <div class="spotick-confirm-box">
                <h3 class="spotick-confirm-title">${title}</h3>
                <p class="spotick-confirm-msg">${message}</p>
                <div class="spotick-confirm-actions">
                    <button class="spotick-confirm-btn spotick-confirm-btn--cancel" id="spotickConfirmCancelBtn" type="button">${cancelText}</button>
                    <button class="spotick-confirm-btn spotick-confirm-btn--${type}" id="spotickConfirmSubmitBtn" type="button">${confirmText}</button>
                </div>
            </div>
        </div>
      `;

      $("body").append(modalHtml);
      const $overlay = $("#spotickConfirmOverlay");

      // DOM에 추가된 후 CSS 애니메이션 트리거를 위해 약간의 지연 시간을 둠
      setTimeout(() => {
        $overlay.addClass("spotick-confirm-overlay--active");
      }, 10);

      /**
       * 모달을 닫고 Promise를 resolve하는 정리 함수
       * @param result - Confirm 결과 (true/false)
       */
      const cleanup = (result: boolean) => {
        $overlay.removeClass("spotick-confirm-overlay--active");
        // CSS transition(0.2s)이 끝난 후 DOM에서 완전히 제거
        setTimeout(() => {
          $overlay.remove();
          resolve(result);
        }, 200);
      };

      // 이벤트 바인딩
      $("#spotickConfirmCancelBtn").on("click", () => cleanup(false));
      $("#spotickConfirmSubmitBtn").on("click", () => cleanup(true));

      // 배경(overlay) 클릭 시 취소 처리
      $overlay.on("click", (e) => {
        if (e.target === e.currentTarget) {
          cleanup(false);
        }
      });
    });
  },
};
