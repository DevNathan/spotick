import $ from "jquery";
import { toast } from "@/utils/sonner";
import { userService } from "@/service/user-service";

$(() => {
  // --- 공통 모달 제어 함수 ---
  const $overlay = $("#userModalOverlay");
  const showModal = ($modal: JQuery<HTMLElement>) => {
    $overlay.fadeIn(200);
    $modal.fadeIn(200);
  };
  const closeAllModals = () => {
    $overlay.fadeOut(200);
    $(".user-modal").fadeOut(200);
  };
  $overlay.on("click", closeAllModals);

  // ==========================================
  // 1. 프로필 이미지 수정
  // ==========================================
  const $userImageBtn = $("#userImageBtn");
  const $profileModal = $("#profileModal");
  const $userProfileImage = $("#userProfileImage");

  $userImageBtn.on("click", () => showModal($profileModal));

  $(".def-pro").on("click", async function () {
    const imageName = $(this).data("img") as string;
    try {
      const result = await userService.updateDefaultImage(imageName);
      if (result.success) {
        toast.success(result.message);
        $userProfileImage.attr(
          "src",
          `/file/default/display?fileName=${imageName}`,
        );
      } else {
        toast.error(result.message);
      }
    } catch (e: any) {
      toast.error("이미지 변경에 실패했습니다.");
    }
    closeAllModals();
  });

  $("#imageUploadInput").on("change", async function (e: any) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1048576) {
      toast.error("파일 크기가 1MB를 초과합니다. 더 작은 파일을 선택해주세요.");
      return;
    }

    try {
      const result = await userService.updatePersonalImage(file);
      if (result.success) {
        const { uploadPath, uuid, fileName } = result.data;
        toast.success(result.message);
        $userProfileImage.attr(
          "src",
          `/file/display?fileName=${uploadPath}/t_${uuid}_${fileName}`,
        );
      } else {
        toast.error(result.message);
      }
    } catch (e: any) {
      toast.error("이미지 업로드에 실패했습니다.");
    }
    closeAllModals();
  });

  // ==========================================
  // 2. 닉네임 수정
  // ==========================================
  const $userNicknameBtn = $("#userNicknameBtn");
  const $nicknameModal = $("#nicknameModal");
  const $newNicknameInput = $("#newNicknameInput");
  const $nicknameChangeBtn = $("#nicknameChangeBtn");
  const $curNickname = $("#curNickname");

  $userNicknameBtn.on("click", () => {
    $newNicknameInput.val("");
    $nicknameChangeBtn.prop("disabled", true);
    showModal($nicknameModal);
    setTimeout(() => $newNicknameInput.trigger("focus"), 200);
  });

  $newNicknameInput.on("keyup", function (e) {
    const val = $(this).val() as string;
    $nicknameChangeBtn.prop("disabled", val.length < 2);
    if (e.key === "Enter" && val.length >= 2) {
      $nicknameChangeBtn.trigger("click");
    }
  });

  $nicknameChangeBtn.on("click", async () => {
    try {
      const result = await userService.updateNickname(
        $newNicknameInput.val() as string,
      );
      if (result.success) {
        toast.success(result.message);
        $curNickname.text(result.data);
      } else {
        toast.error(result.message);
      }
    } catch (e: any) {
      toast.error("닉네임 변경에 실패했습니다.");
    }
    closeAllModals();
  });

  // ==========================================
  // 3. 전화번호 수정
  // ==========================================
  const $telButton = $("#telButton");
  const $telModal = $("#telModal");
  const $newTelInput = $("#newTelInput");
  const $requestAuthCodeBtn = $("#requestAuthCodeBtn");
  const $authNumInputCon = $("#authNumInputCon");
  const $authNumInput = $("#authNumInput");
  const $authConfirmBtn = $("#authConfirmBtn");
  const $timerText = $("#timerText");
  const $curTel = $("#curTel");

  let verificationTimer: number;

  const resetTelModal = () => {
    $newTelInput.val("").prop("disabled", false);
    $requestAuthCodeBtn.prop("disabled", true).text("인증번호 받기");
    $authNumInputCon.hide();
    $authNumInput.val("");
    $authConfirmBtn.prop("disabled", true);
    clearInterval(verificationTimer);
    $timerText.text("");
  };

  $telButton.on("click", () => {
    resetTelModal();
    showModal($telModal);
    setTimeout(() => $newTelInput.trigger("focus"), 200);
  });

  $newTelInput.on("input", function () {
    const val = ($(this).val() as string).replace(/[^0-9]/g, "");
    $(this).val(val);
    $requestAuthCodeBtn.prop("disabled", !/^010\d{8}$/.test(val));
  });

  $requestAuthCodeBtn.on("click", async () => {
    const tel = $newTelInput.val() as string;
    const isStarted = await userService.startTelVerification(tel);

    if (!isStarted) {
      toast.error("인증번호 발송에 실패했습니다.");
      return;
    }

    toast.success("인증번호가 발송되었습니다.");
    $newTelInput.prop("disabled", true);
    $requestAuthCodeBtn.prop("disabled", true).text("재전송");
    $authNumInputCon.css("display", "flex");
    $authNumInput.trigger("focus");

    startTimer();
  });

  $authNumInput.on("input", function () {
    const val = ($(this).val() as string).replace(/[^0-9]/g, "");
    $(this).val(val);
    $authConfirmBtn.prop("disabled", val.length !== 6);
  });

  $authConfirmBtn.on("click", async () => {
    try {
      const result = await userService.updateTel(
        $newTelInput.val() as string,
        $authNumInput.val() as string,
      );
      if (result.success) {
        toast.success(result.message);
        $curTel.val(result.data);
        closeAllModals();
      } else {
        toast.error(result.message);
      }
    } catch (e: any) {
      toast.error("인증 처리 중 오류가 발생했습니다.");
    }
  });

  const startTimer = () => {
    clearInterval(verificationTimer);
    let timer = 60;
    const updateTimer = () => {
      timer--;
      const minutes = Math.floor(timer / 60);
      const seconds = timer % 60;
      $timerText.text(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);

      if (timer <= 0) {
        clearInterval(verificationTimer);
        toast.error("입력시간이 초과되었습니다. 다시 시도해주세요.");
        resetTelModal();
      }
    };
    updateTimer();
    verificationTimer = setInterval(updateTimer, 1000);
  };

  // ==========================================
  // 4. 비밀번호 수정
  // ==========================================
  const $newPw = $("#newPw");
  const $newPwCheck = $("#newPwCheck");
  const $pwChangeConfirm = $("#pwChangeConfirm");

  $pwChangeConfirm.on("click", async () => {
    const password = $newPw.val() as string;
    const passwordCheck = $newPwCheck.val() as string;
    const regex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,15}$/;

    if (!regex.test(password)) {
      toast.error("비밀번호는 영문, 숫자, 특수문자 조합 6~15자리여야 합니다.");
      return;
    }

    if (password !== passwordCheck) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const result = await userService.updatePassword(password);
      if (result.success) {
        toast.success(result.message);
        $newPw.val("");
        $newPwCheck.val("");
      } else {
        toast.error(result.message);
      }
    } catch (e: any) {
      toast.error("비밀번호 변경에 실패했습니다.");
    }
  });
});
