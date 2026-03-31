import $ from "jquery";
import { toast } from "@/utils/sonner";
import { initDistrictFilter } from "@/global/district-filter";

/**
 * 장소 리스트 페이지의 클라이언트 사이드 렌더링(CSR), 무한 스크롤,
 * 필터 모달 및 북마크 연동을 제어하는 통합 모듈입니다.
 */
$(() => {
  const $grid = $("#placeGrid");
  const $spinner = $("#loadingSpinner");
  const $searchInput = $("#searchInput");
  const $sortBtn = $(".place-sort__btn");
  const $sortList = $(".place-sort__list");
  const $sortItems = $(".place-sort__item");
  const $sortInput = $("#sortInput");
  const $sortText = $("#sortTypeText");

  let page = 0;
  let isLastPage = false;
  let isLoading = false;
  let filterData: { region: string; district: string[] } = {
    region: "",
    district: [],
  };

  const isLoggedIn = $("#isLoggedIn").val() === "true";

  // ==========================================
  // 1. 글로벌 지역 필터 모달 초기화
  // ==========================================
  initDistrictFilter(
    "#filterModal",
    "#filterOpenBtn",
    "#filterModalClose, .global-filter-modal__overlay",
    "#filterSubmitBtn",
    "#filterResetBtn",
    (selectedFilter) => {
      filterData = selectedFilter;
      page = 0;
      void fetchPlaces();
    },
  );

  // ==========================================
  // 2. API 통신 및 데이터 렌더링 (CSR)
  // ==========================================
  const fetchPlaces = async (isLoadMore = false) => {
    if (isLoading || (isLoadMore && isLastPage)) return;
    isLoading = true;
    if (!isLoadMore) $grid.empty();
    $spinner.addClass("place-loading--active");

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        sort: $sortInput.val() as string,
      });

      if ($searchInput.val()) {
        params.append("keyword", $searchInput.val() as string);
      }

      if (filterData.region) {
        params.append("region", filterData.region);
      }
      filterData.district.forEach((d) => params.append("district", d));

      const data = await $.ajax({
        url: `/place/api/list?${params.toString()}`,
        method: "GET",
      });

      isLastPage = data.last;

      if (data.content.length === 0 && !isLoadMore) {
        $grid.html(`
                    <div class="place-empty">
                        <i class="fa-solid fa-magnifying-glass" style="font-size: 48px; color: #d1d1d6;"></i>
                        <h3 class="place-empty__title">일치하는 결과가 없어요</h3>
                        <p>검색 범위를 넓히거나 필터를 초기화해보세요.</p>
                    </div>
                `);
      } else {
        renderCards(data.content);
      }
      page++;
    } catch (error) {
      console.error(error);
      toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      isLoading = false;
      $spinner.removeClass("place-loading--active");
    }
  };

  const renderCards = (places: any[]) => {
    const html = places
      .map((place) => {
        const priceStr =
          new Intl.NumberFormat("ko-KR").format(place.price) + "원";

        const bookmarkClass = place.bookmarkChecked
          ? "fa-solid fa-bookmark place-card__bookmark--active"
          : "fa-regular fa-bookmark";

        let sliders = place.placeFiles
          .map(
            (file: any) => `
                <div class="place-card__slide">
                    <img class="place-card__img" src="/file/display?fileName=${file.uploadPath}/${file.uuid}_${file.fileName}" alt="${place.title}">
                </div>
            `
          )
          .join("");

        return `
                <article class="place-card">
                    <div class="place-card__slider-wrap">
                        <button type="button" class="place-card__bookmark" 
                                data-id="${place.id}" 
                                data-checked="${place.bookmarkChecked}">
                            <i class="${bookmarkClass}"></i>
                        </button>
                        <div class="place-card__slider">
                            ${sliders}
                        </div>
                        <button class="place-card__nav place-card__nav--prev"><i class="fa-solid fa-chevron-left"></i></button>
                        <button class="place-card__nav place-card__nav--next"><i class="fa-solid fa-chevron-right"></i></button>
                        <div class="place-card__pagination"><span class="curr-idx">1</span> / ${place.placeFiles.length}</div>
                    </div>
                    <div class="place-card__info" onclick="location.href='/place/${place.id}'">
                        <div class="place-card__meta">
                            <span>${place.placeAddress.address}</span>
                            <div class="place-card__stats">
                                <span class="place-card__stat"><i class="fa-solid fa-star place-card__stat-icon"></i> ${place.evalAvg} (${place.evalCount})</span>
                                <span class="place-card__stat"><i class="fa-solid fa-bookmark" style="color: #8a8a8e;"></i> ${place.bookmarkCount}</span>
                            </div>
                        </div>
                        <h3 class="place-card__title">${place.title}</h3>
                        <div class="place-card__price">${priceStr} <span style="font-size: 12px; font-weight: 500; color: #8a8a8e;">/ 시간</span></div>
                    </div>
                </article>
            `;
      })
      .join("");
    $grid.append(html);
  };

  // ==========================================
  // 3. 무한 스크롤 & UI 인터랙션
  // ==========================================
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading && !isLastPage) {
        void fetchPlaces(true);
      }
    },
    { rootMargin: "200px" },
  );

  const scrollTarget = document.getElementById("scrollTarget");
  if (scrollTarget) observer.observe(scrollTarget);

  $searchInput.on("keypress", (e) => {
    if (e.key === "Enter") {
      page = 0;
      void fetchPlaces();
    }
  });

  $sortBtn.on("click", () => $sortList.toggleClass("place-sort__list--active"));

  $sortItems.on("click", function () {
    $sortItems.removeClass("place-sort__item--active");
    $(this).addClass("place-sort__item--active");
    $sortText.text($(this).text());
    $sortInput.val($(this).data("sort"));
    $sortList.removeClass("place-sort__list--active");
    page = 0;
    void fetchPlaces();
  });

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

  $grid.on("click", ".place-card__bookmark", async function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.error("로그인이 필요한 서비스입니다.");
      location.href = "/user/login";
      return;
    }

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
        toast.success("북마크를 했습니다.");
      } else {
        $icon
          .removeClass("fa-solid place-card__bookmark--active")
          .addClass("fa-regular");
        toast.success("북마크를 취소했습니다.");
      }
    } catch (e) {
      toast.error("북마크 처리에 실패했습니다.");
    }
  });

  void fetchPlaces();
});
