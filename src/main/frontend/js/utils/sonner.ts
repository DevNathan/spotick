import $ from "jquery";

/**
 * Sonner 스타일의 글로벌 토스트 알림을 관리하는 유틸리티 클래스입니다.
 */
class SonnerToast {
  private readonly $toaster: JQuery<HTMLElement>;
  private readonly duration: number = 3000;

  constructor() {
    this.$toaster = $("#sonner-toaster");
  }

  /**
   * 토스트 알림을 화면에 출력합니다.
   * @param message 출력할 메시지
   * @param type 알림의 종류 ('success' | 'error' | 'info')
   */
  private show(message: string, type: "success" | "error" | "info"): void {
    if (this.$toaster.length === 0) return;

    // BEM 기법을 적용한 토스트 요소 생성
    const $toast = $(`
            <div class="sonner-toast sonner-toast--${type}">
                <div class="sonner-toast__icon"></div>
                <div class="sonner-toast__content">
                    <p class="sonner-toast__message">${message}</p>
                </div>
            </div>
        `);

    // 아이콘 설정 (FontAwesome 연동)
    let iconClass = "";
    if (type === "success") iconClass = "fa-solid fa-circle-check";
    else if (type === "error") iconClass = "fa-solid fa-circle-exclamation";
    else iconClass = "fa-solid fa-circle-info";

    $toast.find(".sonner-toast__icon").append(`<i class="${iconClass}"></i>`);

    // 컨테이너에 추가 (새로운 알림이 위로 쌓이도록 prepend 사용)
    this.$toaster.prepend($toast);

    // 일정 시간 후 알림 제거 애니메이션 실행
    setTimeout(() => {
      $toast.addClass("sonner-toast--fade-out");
      setTimeout(() => $toast.remove(), 300); // 애니메이션 완료 후 DOM에서 제거
    }, this.duration);
  }

  /**
   * 성공(Success) 토스트 알림을 호출합니다.
   * @param message 성공 메시지
   */
  public success(message: string): void {
    this.show(message, "success");
  }

  /**
   * 에러(Error) 토스트 알림을 호출합니다.
   * @param message 에러 메시지
   */
  public error(message: string): void {
    this.show(message, "error");
  }

  /**
   * 정보(Info) 토스트 알림을 호출합니다.
   * @param message 정보 메시지
   */
  public info(message: string): void {
    this.show(message, "info");
  }
}

export const toast = new SonnerToast();
