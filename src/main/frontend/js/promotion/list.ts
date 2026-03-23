import $ from "jquery";
import { toast } from "@/utils/sonner";

$(() => {
  const $grid = $("#promotionGrid");
  const $spinner = $("#loadingSpinner");
  const $searchInput = $("#searchInput");
  const $categoryBtns = $(".pro-category__btn");
  const $sortBtn = $(".pro-sort__btn");
  const $sortList = $(".pro-sort__list");
  const $sortItems = $(".pro-sort__item");
  const $sortInput = $("#sortInput");
  const $sortText = $(".pro-sort__text");

  let page = 0;
  let isLastPage = false;
  let isLoading = false;
  let currentCategory = "ALL";

  // ==========================================
  // 1. 커스텀 드래그 슬라이더 로직
  // ==========================================
  const enableDragScroll = (selector: string) => {
    const slider = document.querySelector(selector) as HTMLElement;
    if (!slider) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    slider.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener("mouseleave", () => {
      isDown = false;
    });

    slider.addEventListener("mouseup", () => {
      isDown = false;
    });

    slider.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2; // 스크롤 속도 조절
      slider.scrollLeft = scrollLeft - walk;
    });
  };

  enableDragScroll(".pro-slider__track");
  enableDragScroll(".pro-category__track");

  // ==========================================
  // 2. API 통신 및 데이터 렌더링 (CSR)
  // ==========================================
  const fetchPromotions = async (isLoadMore = false) => {
    if (isLoading || (isLoadMore && isLastPage)) return;
    isLoading = true;
    if (!isLoadMore) $grid.empty();
    $spinner.addClass("pro-loading--active");

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        sort: $sortInput.val() as string,
      });

      if (currentCategory !== "ALL") {
        params.append("category", currentCategory);
      }

      if ($searchInput.val()) {
        params.append("keyword", $searchInput.val() as string);
      }

      const response = await $.ajax({
        url: `/promotion/api/list?${params.toString()}`,
        method: "GET",
      });

      const sliceData = response.data;

      isLastPage = sliceData.last;

      if (sliceData.content.length === 0 && !isLoadMore) {
        $grid.html(`
          <div class="pro-empty">
              <img src="/imgs/empty.png" alt="empty" style="width: 120px; opacity: 0.6; margin-bottom: 16px;">
              <p>일치하는 결과가 없어요.<br>검색 범위를 넓혀 보세요.</p>
          </div>
        `);
      } else {
        renderCards(sliceData.content);
      }
      page++;
    } catch (err) {
      toast.error("데이터를 불러오지 못했습니다.");
    } finally {
      isLoading = false;
      $spinner.removeClass("pro-loading--active");
    }
  };

  const renderCards = (promotions: any[]) => {
    const html = promotions
      .map(
        (pro) => `
        <article class="pro-card" onclick="location.href='/promotion/${pro.promotionId}'">
            <div class="pro-card__img-box">
                <img class="pro-card__img" src="/file/display?fileName=${pro.thumbnailImage.uploadPath}/t_${pro.thumbnailImage.uuid}_${pro.thumbnailImage.fileName}" alt="${pro.title}">
            </div>
            <h3 class="pro-card__title">${pro.title}</h3>
        </article>
      `,
      )
      .join("");
    $grid.append(html);
  };

  // ==========================================
  // 3. UI 인터랙션 (무한 스크롤, 정렬, 카테고리)
  // ==========================================
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && !isLastPage) {
      void fetchPromotions(true);
    }
  });

  const scrollTarget = document.getElementById("scrollTarget");
  if (scrollTarget) observer.observe(scrollTarget);

  $searchInput.on("keypress", (e) => {
    if (e.key === "Enter") {
      page = 0;
      void fetchPromotions();
    }
  });

  $categoryBtns.on("click", function () {
    $categoryBtns.removeClass("pro-category__btn--active");
    $(this).addClass("pro-category__btn--active");
    currentCategory = $(this).data("category") as string;
    page = 0;
    void fetchPromotions();
  });

  $sortBtn.on("click", (e) => {
    e.stopPropagation();
    $sortList.toggleClass("pro-sort__list--active");
  });

  $sortItems.on("click", function () {
    $sortItems.removeClass("pro-sort__item--active");
    $(this).addClass("pro-sort__item--active");
    $sortText.text($(this).text());
    $sortInput.val($(this).data("sort"));
    $sortList.removeClass("pro-sort__list--active");
    page = 0;
    void fetchPromotions();
  });

  $(document).on("click", () =>
    $sortList.removeClass("pro-sort__list--active"),
  );

  void fetchPromotions();
});
