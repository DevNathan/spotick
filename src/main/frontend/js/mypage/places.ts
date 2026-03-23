import $ from "jquery";
import { confirmModal } from "@/utils/confirm";
import { alertModal } from "@/utils/alert";

/**
 * 마이페이지 - 장소 관리 페이지의 동작을 제어하는 모듈입니다.
 * 비동기 모달(Confirm, Alert) 기반의 안전한 API 통신 및 DOM 캐싱을 수행합니다.
 */
$(() => {
  const currentPageVal = $("#currentPage").val();
  const currentPage = currentPageVal
    ? parseInt(currentPageVal as string, 10)
    : 1;

  const $manageGrid = $("#manageGrid");
  const $sortBtn = $(".place-sort__btn");
  const $sortList = $(".place-sort__list");
  const $sortItems = $(".place-sort__item");

  // ==========================================
  // 1. 정렬 드롭다운 제어
  // ==========================================
  $sortBtn.on("click", () => $sortList.toggleClass("place-sort__list--active"));

  $sortItems.on("click", function () {
    const sortType = $(this).data("sort");
    window.location.href = `/mypage/places?page=${currentPage}&sort=${sortType}`;
  });

  // ==========================================
  // 2. 바닐라 JS 기반 이미지 슬라이더
  // ==========================================
  $manageGrid.on("click", ".manage-card__nav", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const $slider = $(this).siblings(".manage-card__slider");
    const direction = $(this).hasClass("manage-card__nav--next") ? 1 : -1;
    const scrollAmount = ($slider.width() || 0) * direction;

    $slider[0].scrollBy({ left: scrollAmount, behavior: "smooth" });

    setTimeout(() => {
      const idx =
        Math.round($slider[0].scrollLeft / ($slider.width() || 1)) + 1;
      $(this).siblings(".manage-card__pagination").find(".curr-idx").text(idx);
    }, 300);
  });

  // ==========================================
  // 3. 카드 내 액션 메뉴(드롭다운) 토글
  // ==========================================
  $manageGrid.on("click", ".manage-more-btn", function (e) {
    e.stopPropagation();
    // 다른 열려있는 드롭다운 닫기
    $(".manage-dropdown")
      .not($(this).next())
      .removeClass("manage-dropdown--active");
    $(this).next(".manage-dropdown").toggleClass("manage-dropdown--active");
  });

  // 외부 클릭 시 드롭다운 닫기
  $(document).on("click", () => {
    $(".manage-dropdown").removeClass("manage-dropdown--active");
  });

  // ==========================================
  // 4. 비즈니스 로직: 비동기 API 통신 및 모달 연동
  // ==========================================

  // [대여 중지]
  $manageGrid.on("click", ".action-disable", async function () {
    const placeId = $(this).closest(".manage-card").data("id");

    const isConfirmed = await confirmModal.show({
      title: "장소 대여 중지",
      message:
        "장소 대여를 중단하시겠습니까?\n(대여 중지 시, 이미 들어온 대여 요청은 모두 취소됩니다.)",
      confirmText: "중지하기",
      type: "destroy",
    });

    if (!isConfirmed) return;

    try {
      const res = await $.ajax({
        url: `/place/api/disable/${placeId}`,
        method: "PATCH",
      });
      await alertModal.show({ title: "처리 완료", message: res.message });
      window.location.reload();
    } catch (err: any) {
      await alertModal.show({
        title: "처리 실패",
        message: err.responseJSON?.message || "오류가 발생했습니다.",
        type: "error",
      });
    }
  });

  // [대여 재개]
  $manageGrid.on("click", ".action-enable", async function () {
    const placeId = $(this).closest(".manage-card").data("id");

    const isConfirmed = await confirmModal.show({
      title: "장소 대여 재개",
      message: "해당 장소를 다시 활성화하여 대여를 재개하시겠습니까?",
      confirmText: "재개하기",
    });

    if (!isConfirmed) return;

    try {
      const res = await $.ajax({
        url: `/place/api/approve/${placeId}`,
        method: "PATCH",
      });
      await alertModal.show({ title: "처리 완료", message: res.message });
      window.location.reload();
    } catch (err: any) {
      await alertModal.show({
        title: "처리 실패",
        message: err.responseJSON?.message || "오류가 발생했습니다.",
        type: "error",
      });
    }
  });

  // [장소 삭제]
  $manageGrid.on("click", ".action-delete", async function () {
    const placeId = $(this).closest(".manage-card").data("id");

    const isConfirmed = await confirmModal.show({
      title: "장소 영구 삭제",
      message:
        "등록한 장소를 삭제하시겠습니까?\n이 작업은 다시 되돌릴 수 없습니다!",
      confirmText: "삭제하기",
      type: "destroy",
    });

    if (!isConfirmed) return;

    try {
      const res = await $.ajax({
        url: `/place/api/delete/${placeId}`,
        method: "DELETE",
      });
      await alertModal.show({ title: "삭제 완료", message: res.message });
      window.location.reload();
    } catch (err: any) {
      await alertModal.show({
        title: "삭제 실패",
        message: err.responseJSON?.message || "오류가 발생했습니다.",
        type: "error",
      });
    }
  });

  // [장소 수정]
  $manageGrid.on("click", ".action-edit", function () {
    const placeId = $(this).closest(".manage-card").data("id");
    // 단순 페이지 이동은 모달 없이 즉시 실행
    window.location.href = `/place/edit/${placeId}`;
  });
});
