import $ from "jquery";
import { reviewService } from "@/service/review-service";
import { alertModal } from "@/utils/alert";
import { confirmModal } from "@/utils/confirm";

$(() => {
  let currentReservationId: number | null = null;

  const $reviewModal = $("#reviewModal");
  const $stars = $(".rv-star");
  const $reviewScore = $("#reviewScore");
  const $reviewContent = $("#reviewContent");
  const $reviewLength = $("#reviewLength");

  // ==========================================
  // 액션: 후기 작성 안함 처리
  // ==========================================
  $(document).on("click", ".action-delete", async function () {
    const reservationId = $(this).data("id");

    const isConfirm = await confirmModal.show({
      title: "후기 작성 안함",
      message: "리뷰는 호스트에게 큰 힘이 됩니다!<br>그래도 삭제하시겠습니까?",
    });

    if (isConfirm) {
      reviewService
        .setNotReviewing(reservationId)
        .done(async (res: any) => {
          if (res.success) {
            await alertModal.show({ title: "성공", message: res.message });
            window.location.reload();
          } else {
            await alertModal.show({
              title: "실패",
              message: res.message,
              type: "error",
            });
          }
        })
        .fail(() => {
          alertModal.show({
            title: "오류",
            message: "처리 중 오류가 발생했습니다.",
            type: "error",
          });
        });
    }
  });

  // ==========================================
  // 액션: 후기 작성 모달 열기
  // ==========================================
  $(document).on("click", ".action-write", function () {
    currentReservationId = $(this).data("id");

    // 모달 데이터 초기화
    $reviewScore.val(0);
    $stars.removeClass("active");
    $reviewContent.val("");
    $reviewLength.text("0");

    $reviewModal.addClass("is-active");
  });

  // ==========================================
  // 모달: 닫기 및 초기화
  // ==========================================
  $("#reviewModalClose").on("click", () => {
    $reviewModal.removeClass("is-active");
    currentReservationId = null;
  });

  // ==========================================
  // 모달: 별점 클릭 이벤트
  // ==========================================
  $stars.on("click", function () {
    const score = $(this).data("score");
    $reviewScore.val(score);

    $stars.each(function () {
      if ($(this).data("score") <= score) {
        $(this).addClass("active");
      } else {
        $(this).removeClass("active");
      }
    });
  });

  // ==========================================
  // 모달: 글자 수 카운팅
  // ==========================================
  $reviewContent.on("input", function () {
    const val = $(this).val() as string;
    if (val.length > 200) {
      $(this).val(val.slice(0, 200));
    }
    $reviewLength.text($(this).val()?.toString().length || 0);
  });

  // ==========================================
  // 모달: 후기 등록 제출
  // ==========================================
  $("#reviewSubmitBtn").on("click", () => {
    const score = Number($reviewScore.val());
    const content = $reviewContent.val() as string;

    if (score === 0) {
      alertModal.show({ title: "알림", message: "별점을 선택해주세요." });
      return;
    }

    if (!content.trim()) {
      alertModal.show({ title: "알림", message: "후기 내용을 입력해주세요." });
      return;
    }

    if (!currentReservationId) return;

    reviewService
      .registerReview(currentReservationId, score, content)
      .done(async (res: any) => {
        if (res.success) {
          await alertModal.show({ title: "성공", message: res.message });
          window.location.reload();
        } else {
          await alertModal.show({
            title: "실패",
            message: res.message,
            type: "error",
          });
        }
      })
      .fail(() => {
        alertModal.show({
          title: "오류",
          message: "후기 등록에 실패했습니다.",
          type: "error",
        });
      });
  });

  // ==========================================
  // 북마크 토글 기능
  // ==========================================
  $(document).on("click", ".ItemBookMarkBtn", function () {
    const $btn = $(this);
    const placeId = $btn.data("id");
    const status = $btn.data("status");

    $.ajax({
      url: `/bookmark/api/toggle`, // 북마크 API 경로 확인 후 수정 요망
      type: "POST",
      data: { placeId: placeId, status: status },
    })
      .done((boo: boolean) => {
        $btn.data("status", boo);
        const $off = $btn.find(".off");
        const $on = $btn.find(".on");

        if (boo) {
          $off.addClass("none");
          $on.removeClass("none");
        } else {
          $off.removeClass("none");
          $on.addClass("none");
        }
      })
      .fail(() => {
        console.error("북마크 변경 실패");
      });
  });
});
