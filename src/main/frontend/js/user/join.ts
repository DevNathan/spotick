import $ from "jquery";

/**
 * 회원가입 페이지의 유효성 검사 및 비동기 중복 체크를 관리하는 모듈입니다.
 * 모든 인풋 필드와 약관 동의 상태를 실시간으로 감시하여 가입 버튼을 제어합니다.
 */
$(() => {
  const $joinForm = $(".join-form");
  const $submitBtn = $(".join-form__submit-btn");

  /**
   * 각 필드의 유효성 상태를 추적하는 객체입니다.
   * 모든 값이 true가 되어야 가입 버튼이 활성화됩니다.
   */
  const validationState = {
    email: false,
    password: false,
    nickName: false,
    tel: false,
    agreement: false,
  };

  /**
   * 전체 유효성 상태를 확인하여 회원가입 버튼의 활성화 상태를 갱신합니다.
   */
  const updateSubmitButton = (): void => {
    const isAllValid = Object.values(validationState).every(
      (val) => val === true,
    );
    $submitBtn.prop("disabled", !isAllValid);
    $submitBtn.toggleClass("join-form__submit-btn--active", isAllValid);
  };

  /**
   * 이메일 유효성 및 중복 여부를 검사합니다.
   */
  const validateEmail = async (): Promise<void> => {
    const email = $("#email").val() as string;
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const $error = $("#emailError");

    if (!regex.test(email)) {
      $error.text("유효하지 않은 이메일 형식입니다.");
      validationState.email = false;
      updateSubmitButton();
      return;
    }

    try {
      const isAvailable = await $.ajax({
        url: `/users/api/valid/email/${email}`,
        method: "GET",
      });
      $error.text(isAvailable ? "" : "이미 존재하는 이메일입니다.");
      validationState.email = isAvailable;
    } catch (e) {
      $error.text("이메일 중복 확인 중 오류가 발생했습니다.");
      validationState.email = false;
    }
    updateSubmitButton();
  };

  /**
   * 닉네임 유효성 및 중복 여부를 검사합니다.
   */
  const validateNickName = async (): Promise<void> => {
    const nickname = $("#nick-name").val() as string;
    const $error = $("#nickNameError");

    if (nickname.trim().length < 2) {
      $error.text("닉네임은 최소 2자 이상 입력해주세요.");
      validationState.nickName = false;
      updateSubmitButton();
      return;
    }

    try {
      const isAvailable = await $.ajax({
        url: `/users/api/valid/nickname/${nickname}`,
        method: "GET",
      });
      $error.text(isAvailable ? "" : "이미 존재하는 닉네임입니다.");
      validationState.nickName = isAvailable;
    } catch (e) {
      $error.text("닉네임 중복 확인 중 오류가 발생했습니다.");
      validationState.nickName = false;
    }
    updateSubmitButton();
  };

  /**
   * 비밀번호 정규표현식 유효성을 검사합니다.
   */
  const validatePassword = (): void => {
    const password = $("#password").val() as string;
    const regex = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,20}$/;
    const $error = $("#passwordError");

    const isValid = regex.test(password);
    $error.text(
      isValid ? "" : "영문/숫자/특수문자 조합 8~20자로 입력해주세요.",
    );
    validationState.password = isValid;
    updateSubmitButton();
  };

  /**
   * 전화번호 형식을 검사합니다.
   */
  const validateTel = (): void => {
    const tel = $("#tel").val() as string;
    const regex = /^01([0|1|6|7|8|9]?)-?([0-9]{3,4})-?([0-9]{4})$/;
    const $error = $("#telError");

    const isValid = regex.test(tel);
    $error.text(isValid ? "" : "올바른 전화번호를 입력해주세요.");
    validationState.tel = isValid;
    updateSubmitButton();
  };

  /**
   * 필수 약관 동의 여부를 확인합니다.
   */
  const checkAgreement = (): void => {
    const requiredCount = $(".agreement__item--required").length;
    const activeRequiredCount = $(
      ".agreement__item--required.agreement__item--active",
    ).length;

    validationState.agreement = requiredCount === activeRequiredCount;
    updateSubmitButton();
  };

  /**
   * 약관 동의 섹션의 클릭 이벤트들을 바인딩합니다.
   */
  const bindAgreementEvents = (): void => {
    // 전체 동의 버튼
    $(".agreement__all-check").on("click", function () {
      const $this = $(this);
      const isChecking = !$this.hasClass("agreement__all-check--active");

      $this.toggleClass("agreement__all-check--active", isChecking);
      $(".agreement__item").toggleClass("agreement__item--active", isChecking);
      checkAgreement();
    });

    // 개별 동의 버튼
    $(".agreement__item").on("click", function () {
      $(this).toggleClass("agreement__item--active");

      const totalItems = $(".agreement__item").length;
      const activeItems = $(".agreement__item--active").length;

      $(".agreement__all-check").toggleClass(
        "agreement__all-check--active",
        totalItems === activeItems,
      );
      checkAgreement();
    });
  };

  /**
   * 모든 이벤트를 초기화하고 바인딩합니다.
   */
  const init = (): void => {
    // 실시간 입력 감지
    $("#email").on("change", validateEmail);
    $("#password").on("input", validatePassword);
    $("#nick-name").on("change", validateNickName);
    $("#tel").on("input", validateTel);

    // 약관 동의 이벤트
    bindAgreementEvents();

    // 폼 제출 방어 로직
    $joinForm.on("submit", (e) => {
      if (!Object.values(validationState).every((val) => val === true)) {
        e.preventDefault();
        alert("모든 입력 항목을 올바르게 채워주세요.");
      }
    });
  };

  init();
});
