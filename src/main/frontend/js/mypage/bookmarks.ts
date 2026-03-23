import $ from "jquery";
import { toast } from "@/utils/sonner";

/**
 * 마이페이지 북마크 리스트의 UI 및 API 연동을 제어하는 모듈입니다.
 * 정렬 드롭다운 제어, 바닐라 슬라이더 내비게이션, 북마크 토글 기능을 담당합니다.
 */
$(() => {
  // DOM에 은닉된 데이터로부터 현재 페이지 번호 안전하게 추출
  const currentPageVal = $("#currentPage").val();
  const currentPage = currentPageVal
    ? parseInt(currentPageVal as string, 10)
    : 1;

  const $grid = $("#bookmarkGrid");
  const $sortBtn = $(".place-sort__btn");
  const $sortList = $(".place-sort__list");
  const $sortItems = $(".place-sort__item");

  // ==========================================
  // 1. 정렬 드롭다운 이벤트 핸들링
  // ==========================================
  $sortBtn.on("click", () => $sortList.toggleClass("place-sort__list--active"));

  $sortItems.on("click", function () {
    const sortType = $(this).data("sort");
    window.location.href = `/mypage/bookmarks?page=${currentPage}&sort=${sortType}`;
  });

  // ==========================================
  // 2. 카드 내부 바닐라 JS 기반 이미지 슬라이더
  // ==========================================
  $grid.on("click", ".place-card__nav", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const $slider = $(this).siblings(".place-card__slider");
    const direction = $(this).hasClass("place-card__nav--next") ? 1 : -1;
    const scrollAmount = ($slider.width() || 0) * direction;

    $slider[0].scrollBy({ left: scrollAmount, behavior: "smooth" });

    setTimeout(() => {
      const idx =
        Math.round($slider[0].scrollLeft / ($slider.width() || 1)) + 1;
      $(this).siblings(".place-card__pagination").find(".curr-idx").text(idx);
    }, 300);
  });

  // ==========================================
  // 3. 북마크 토글 이벤트 ($.ajax 연동)
  // ==========================================
  $grid.on("click", ".place-card__bookmark", async function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $btn = $(this);
    const placeId = $btn.attr("data-id");
    const isChecked = $btn.attr("data-checked") === "true";
    const $icon = $btn.find("i");

    try {
      const result = await $.ajax({
        url: `/bookmark?placeId=${placeId}&status=${isChecked}`,
        method: "GET",
      });

      $btn.attr("data-checked", result.toString());
      if (result) {
        $icon
          .removeClass("fa-regular")
          .addClass("fa-solid place-card__bookmark--active");
        toast.success("북마크를 추가했습니다.");
      } else {
        $icon
          .removeClass("fa-solid place-card__bookmark--active")
          .addClass("fa-regular");
        toast.success("북마크를 취소했습니다.");
      }
    } catch (error) {
      toast.error("북마크 처리에 실패했습니다.");
    }
  });
});
