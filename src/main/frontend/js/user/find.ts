import $ from "jquery";
import { toast } from "@/utils/sonner";

/**
 * 아이디 및 비밀번호 찾기 페이지의 로직을 담당하는 모듈입니다.
 * 중복 DOM 탐색을 제거하고 Caching을 적용하여 렌더링 성능을 최적화했습니다.
 * 모든 비동기 통신 규격을 $.ajax로 통일하여 코드의 일관성을 확보했습니다.
 */
$(() => {
  const $findBody = $("#find-body");
  const $findCardTabsContainer = $(".find-card__tabs");
  const $findCardTabs = $(".find-card__tab");
  const $findSections = $(".find-section");

  let passwordContentHtml = "";

  /**
   * 탭 전환 로직을 수행합니다.
   */
  $findCardTabsContainer.on("click", ".find-card__tab", function () {
    const $this = $(this);
    const target = $this.data("target");

    $findCardTabs.removeClass("find-card__tab--active");
    $this.addClass("find-card__tab--active");

    $findSections.removeClass("find-section--active");

    if (target === "id") {
      $findBody.find(".find-section--id").addClass("find-section--active");
      if (passwordContentHtml !== "") {
        $findBody
          .find(".find-section--password")
          .replaceWith(passwordContentHtml);
      }
    } else {
      $findBody
        .find(".find-section--password")
        .addClass("find-section--active");
    }

    $findBody.find(".find-card__input").val("");
    $findBody.find(".find-card__submit-btn").prop("disabled", true);
    $findBody
      .find(".find-card__cert-btn")
      .removeClass("find-card__cert-btn--active")
      .prop("disabled", true)
      .text("인증번호");
    $findBody.find("#certNumber, #passwordCertNumber").prop("readonly", true);
    $findBody.find(".find-card__error-msg").text("");
  });

  /**
   * 인풋 값의 정규식 유효성을 검사합니다.
   */
  const validateInput = (
    $input: JQuery,
    regex: RegExp,
    $errorMsg: JQuery,
    msg: string,
  ): boolean => {
    const value = $input.val() as string;
    const isValid = regex.test(value.trim());
    $errorMsg.text(isValid ? "" : msg);
    return isValid;
  };

  /**
   * 아이디 찾기 폼의 인증 버튼 상태를 갱신합니다.
   */
  const updateIdCertBtnState = (): void => {
    const isNicknameValid = /^[가-힣A-Za-z]+$/.test(
      ($findBody.find("#nickname").val() as string).trim(),
    );
    const isTelValid = /^\d{10,11}$/.test(
      ($findBody.find("#tel").val() as string).trim(),
    );

    const $btn = $findBody.find("#id-cert-btn");
    if (isNicknameValid && isTelValid) {
      $btn.addClass("find-card__cert-btn--active").prop("disabled", false);
    } else {
      $btn.removeClass("find-card__cert-btn--active").prop("disabled", true);
    }
  };

  $findBody.on("input", "#nickname", function () {
    validateInput(
      $(this),
      /^[가-힣A-Za-z]+$/,
      $findBody.find("#nickname-error"),
      "닉네임을 정확히 입력해주세요.",
    );
    updateIdCertBtnState();
  });

  $findBody.on("input", "#tel", function () {
    validateInput(
      $(this),
      /^\d{10,11}$/,
      $findBody.find("#tel-error"),
      "전화번호를 정확히 입력해주세요.",
    );
    updateIdCertBtnState();
  });

  /**
   * 아이디 찾기 인증번호 발송을 서버에 요청합니다.
   */
  $findBody.on(
    "click",
    "#id-cert-btn.find-card__cert-btn--active",
    async function () {
      const $btn = $(this);
      const $certMsg = $findBody.find("#id-cert-msg");

      try {
        await $.ajax({
          url: "/users/api/tel/cert/code",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({
            nickname: $findBody.find("#nickname").val(),
            tel: $findBody.find("#tel").val(),
          }),
        });

        $certMsg.text("").css("color", "#3c82fa");
        toast.success("인증번호가 발송되었습니다.");
        $findBody.find("#certNumber").prop("readonly", false).trigger("focus");
        $btn.text("재전송");
      } catch (error: any) {
        const errMsg =
          error.responseJSON?.message || "인증번호 발송에 실패했습니다.";
        $certMsg.text(errMsg).css("color", "#ff3b30");
      }
    },
  );

  $findBody.on("input", "#certNumber", function () {
    $findBody
      .find("#find-id-btn")
      .prop("disabled", ($(this).val() as string).trim() === "");
  });

  /**
   * 아이디 찾기 최종 요청 및 결과 화면 렌더링을 처리합니다.
   */
  $findBody.on("click", "#find-id-btn", async function () {
    const $certMsg = $findBody.find("#id-cert-msg");

    try {
      const result = await $.ajax({
        url: "/users/api/find/email",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
          nickname: $findBody.find("#nickname").val(),
          tel: $findBody.find("#tel").val(),
          certCode: $findBody.find("#certNumber").val(),
        }),
      });

      showFoundId(result.data.email, result.data.createdDateStr);
    } catch (error: any) {
      const errMsg =
        error.responseJSON?.message || "인증번호가 올바르지 않습니다.";
      $certMsg.text(errMsg).css("color", "#ff3b30");
    }
  });

  const showFoundId = (email: string, registerDate: string): void => {
    const html = `
            <section class="find-section find-section--active">
                <p class="find-section__guide">아이디 찾기가 완료되었습니다.</p>
                <div class="find-result">
                    <h4 class="find-result__email">${email}</h4>
                    <p class="find-result__date">가입일: ${registerDate}</p>
                </div>
                <div class="find-result__info">
                    <p>아이디/비밀번호 찾기가 안되는 경우,<br>고객센터 02-0000-0000로 문의 부탁드립니다.<br>문의 시간은 평일 : 10:00~19:00입니다.</p>
                </div>
                <a href="/user/login?username=${email}" class="find-card__submit-btn" style="text-decoration: none;">로그인</a>
            </section>
        `;
    $findBody.html(html);
    $findCardTabsContainer.hide();
  };

  // ---------------------- 비밀번호 찾기 파트 ----------------------

  $findBody.on("input", "#email", function () {
    const isValid = validateInput(
      $(this),
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
      $findBody.find("#email-error"),
      "올바른 이메일 형식을 입력해주세요.",
    );
    const $btn = $findBody.find("#pw-cert-btn");
    if (isValid) {
      $btn.addClass("find-card__cert-btn--active").prop("disabled", false);
    } else {
      $btn.removeClass("find-card__cert-btn--active").prop("disabled", true);
    }
  });

  $findBody.on(
    "click",
    "#pw-cert-btn.find-card__cert-btn--active",
    async function () {
      const $btn = $(this);
      const $certMsg = $findBody.find("#pw-cert-msg");

      try {
        await $.ajax({
          url: "/users/api/email/cert/code",
          method: "POST",
          contentType: "text/plain",
          data: $findBody.find("#email").val() as string,
        });

        $certMsg.text("").css("color", "#3c82fa");
        toast.success("인증번호가 발송되었습니다.");
        $findBody
          .find("#passwordCertNumber")
          .prop("readonly", false)
          .trigger("focus");
        $btn.text("재전송");
      } catch (error: any) {
        const errMsg =
          error.responseJSON?.message || "이메일 전송에 실패했습니다.";
        $certMsg.text(errMsg).css("color", "#ff3b30");
      }
    },
  );

  $findBody.on("input", "#passwordCertNumber", function () {
    $findBody
      .find("#find-pw-btn")
      .prop("disabled", ($(this).val() as string).trim() === "");
  });

  $findBody.on("click", "#find-pw-btn", async function () {
    const email = $findBody.find("#email").val() as string;
    const $certMsg = $findBody.find("#pw-cert-msg");

    try {
      await $.ajax({
        url: "/users/api/find/password",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
          email: email,
          certCode: $findBody.find("#passwordCertNumber").val(),
        }),
      });

      $certMsg.text("");
      passwordContentHtml = $findBody.find(".find-section--password")[0]
        .outerHTML;
      setPasswordChangeContent(email);
    } catch (error: any) {
      const errMsg =
        error.responseJSON?.message || "인증번호를 다시 확인해주세요.";
      $certMsg.text(errMsg).css("color", "#ff3b30");
    }
  });

  const setPasswordChangeContent = (email: string): void => {
    const html = `
            <section class="find-section find-section--active">
                <form action="/user/modify/password" method="post" id="setPasswordForm">
                    <p class="find-section__guide">새로 사용할 비밀번호를 입력해 주세요</p>
                    <input name="email" type="hidden" value="${email}">
                    
                    <div class="find-card__field">
                        <div class="find-card__input-wrapper">
                            <input id="new-password" type="password" class="find-card__input" name="password" placeholder="비밀번호(영문+숫자+특수문자, 6~15자)">
                        </div>
                        <p class="find-card__error-msg" id="new-pw-error"></p>
                    </div>
                    
                    <div class="find-card__field">
                        <div class="find-card__input-wrapper">
                            <input id="new-password-check" type="password" class="find-card__input" placeholder="비밀번호 확인">
                        </div>
                        <p class="find-card__error-msg" id="new-pw-check-error"></p>
                    </div>
                    
                    <button type="button" class="find-card__submit-btn" id="change-password-btn" disabled>비밀번호 변경</button>
                </form>
            </section>
        `;
    $findBody.html(html);
  };

  $findBody.on("input", "#new-password, #new-password-check", function () {
    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,15}$/;
    const pw = $findBody.find("#new-password").val() as string;
    const pwCheck = $findBody.find("#new-password-check").val() as string;

    const isValidPw = regex.test(pw);
    const isSame = pw === pwCheck && pw !== "";

    $findBody
      .find("#new-pw-error")
      .text(
        isValidPw
          ? ""
          : "비밀번호는 영문+숫자+특수문자, 6~15자로 입력해주세요.",
      );
    $findBody
      .find("#new-pw-check-error")
      .text(isSame || pwCheck === "" ? "" : "비밀번호가 일치하지 않습니다.");

    $findBody
      .find("#change-password-btn")
      .prop("disabled", !(isValidPw && isSame));
  });

  $findBody.on("click", "#change-password-btn", function () {
    toast.success("비밀번호가 성공적으로 변경되었습니다.");
    setTimeout(() => {
      ($findBody.find("#setPasswordForm")[0] as HTMLFormElement).submit();
    }, 1000);
  });
});
