import $ from "jquery";
import { toast } from "@/utils/sonner";

/**
 * 로그인 페이지 UI 제어 및 유효성 검사 모듈입니다.
 */
$(() => {
  const $loginForm = $(".login-card__form");
  const $submitBtn = $(".login-card__submit-btn");
  const $inputs = $(".login-card__input");
  const $msgInput = $(".msg");

  /**
   * URL 쿼리 파라미터를 확인하여 상황에 맞는 알림을 출력하고 URL을 정리합니다.
   */
  const checkUrlParams = (): void => {
    const urlParams = new URLSearchParams(window.location.search);
    let shouldCleanUrl = false;

    if (urlParams.get("join") === "true") {
      toast.success("회원가입이 완료되었습니다. 로그인해주세요.");
      shouldCleanUrl = true;
    } else if (urlParams.get("req") === "true") {
      toast.error("로그인이 필요한 서비스입니다.");
      shouldCleanUrl = true;
    }

    // 처리된 파라미터가 있다면 URL을 깔끔하게 세탁한다.
    if (shouldCleanUrl) {
      const cleanUrl =
        window.location.protocol +
        "//" +
        window.location.host +
        window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, "", cleanUrl);
    }
  };

  /**
   * 서버에서 전달된 가이드 메시지를 확인하여 알림을 출력합니다.
   */
  const checkGuideMessage = (): void => {
    const msg = $msgInput.val() as string;
    if (msg) {
      toast.error(msg);
    }
  };

  /**
   * 이메일 형식을 정규표현식으로 검증합니다.
   * @param email 검증할 이메일 문자열
   */
  const isValidEmailFormat = (email: string): boolean => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
  };

  /**
   * 비밀번호의 유효성을 검사합니다.
   * @param password 검증할 비밀번호 문자열
   */
  const isValidPasswordLength = (password: string): boolean => {
    return password.length > 0;
  };

  /**
   * 폼 전체 유효성을 검사하여 제출 버튼 상태를 갱신합니다.
   */
  const validateForm = (): void => {
    const username = ($('input[name="username"]').val() as string) || "";
    const password = ($('input[name="password"]').val() as string) || "";

    const isFormValid =
      isValidEmailFormat(username) && isValidPasswordLength(password);

    $submitBtn.prop("disabled", !isFormValid);
    $submitBtn.toggleClass("login-card__submit-btn--active", isFormValid);
  };

  const init = (): void => {
    // 통합 URL 파라미터 감지기 실행
    checkUrlParams();
    checkGuideMessage();

    $inputs.on("input", validateForm);

    $inputs
      .on("focus", function () {
        $(this).addClass("login-card__input--focused");
      })
      .on("blur", function () {
        $(this).removeClass("login-card__input--focused");
      });

    $loginForm.on("submit", function (e) {
      const username = ($('input[name="username"]').val() as string) || "";
      const password = ($('input[name="password"]').val() as string) || "";

      if (!isValidEmailFormat(username) || !isValidPasswordLength(password)) {
        e.preventDefault();
        toast.error("올바른 이메일 형식과 비밀번호를 입력해주세요.");
      }
    });
  };

  init();
});
