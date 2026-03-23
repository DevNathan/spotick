import $ from "jquery";

/**
 * Alert 모달의 구성 옵션을 정의하는 인터페이스입니다.
 */
export interface AlertOptions {
  /** Alert 모달의 제목 */
  title: string;
  /** Alert 모달의 상세 내용 */
  message: string;
  /** 확인 버튼의 텍스트 (기본값: "확인") */
  buttonText?: string;
  /** * 알림의 성격에 따른 버튼 색상 타입
   * - 'point': 일반적인 정보 전달 (파란색 계열)
   * - 'error': 경고 또는 에러 알림 (빨간색 계열)
   * (기본값: "point")
   */
  type?: "point" | "error";
}

/**
 * 전역으로 사용되는 커스텀 Alert 모달 유틸리티입니다.
 */
export const alertModal = {
  /**
   * Alert 모달을 화면에 렌더링합니다.
   * 사용자가 확인 버튼을 누르거나 모달을 닫을 때 resolve 되는 Promise를 반환합니다.
   * * @param options - Alert 옵션 객체
   * @returns 모달이 닫힐 때 완료되는 Promise
   */
  show: (options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      const { title, message, buttonText = "확인", type = "point" } = options;

      // 이전 인스턴스가 존재할 경우 안전하게 제거
      $("#spotickAlertOverlay").remove();

      const modalHtml = `
        <div class="spotick-alert-overlay" id="spotickAlertOverlay">
            <div class="spotick-alert-box">
                <h3 class="spotick-alert-title">${title}</h3>
                <p class="spotick-alert-msg">${message}</p>
                <div class="spotick-alert-actions">
                    <button class="spotick-alert-btn spotick-alert-btn--${type}" id="spotickAlertSubmitBtn" type="button">${buttonText}</button>
                </div>
            </div>
        </div>
      `;

      $("body").append(modalHtml);
      const $overlay = $("#spotickAlertOverlay");

      // DOM 삽입 후 애니메이션 트리거
      setTimeout(() => {
        $overlay.addClass("spotick-alert-overlay--active");
      }, 10);

      /**
       * 모달을 닫고 Promise를 resolve하는 정리 함수
       */
      const cleanup = () => {
        $overlay.removeClass("spotick-alert-overlay--active");
        setTimeout(() => {
          $overlay.remove();
          resolve();
        }, 200);
      };

      // 이벤트 바인딩
      $("#spotickAlertSubmitBtn").on("click", () => cleanup());

      // 배경(overlay) 클릭 시 닫기 처리
      $overlay.on("click", (e) => {
        if (e.target === e.currentTarget) {
          cleanup();
        }
      });
    });
  },
};
