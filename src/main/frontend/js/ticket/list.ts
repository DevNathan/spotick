import $ from "jquery";
import { toast } from "@/utils/sonner";
import { initDistrictFilter } from "@/global/district-filter";
import { ticketService } from "@/service/ticket-service";

$(() => {
  const $grid = $("#ticketGrid");
  const $spinner = $("#loadingSpinner");
  const $searchInput = $("#searchInput");

  let page = 0;
  let isLastPage = false;
  let isLoading = false;

  let currentCategory = "ALL";
  let currentSort = "POPULARITY";
  let currentRating = "no";
  let filterData: { region: string; district: string[] } = {
    region: "",
    district: [],
  };

  const isLoggedIn = $("#isLoggedIn").val() === "true";

  // 글로벌 지역 필터 모달 연결
  initDistrictFilter(
    "#filterModal",
    "#filterOpenBtn",
    "#filterModalClose, .global-filter-modal__overlay",
    "#filterSubmitBtn",
    "#filterResetBtn",
    (selectedFilter) => {
      filterData = selectedFilter;
      page = 0;
      void fetchTickets();
    },
  );

  const fetchTickets = async (isLoadMore = false) => {
    if (isLoading || (isLoadMore && isLastPage)) return;
    isLoading = true;
    if (!isLoadMore) $grid.empty();
    $spinner.addClass("tk-list-loading--active");

    try {
      const data = await ticketService.getList(
        page,
        currentCategory,
        currentRating,
        currentSort,
        filterData.region,
        filterData.district,
        $searchInput.val() as string,
      );

      isLastPage = data.last;

      if (data.content.length === 0 && !isLoadMore) {
        $grid.html(`
          <div class="tk-list-empty">
            <img src="/imgs/empty.png" alt="empty" style="width:120px; opacity:0.6;">
            <p>일치하는 티켓이 없어요.<br>검색 조건이나 필터를 변경해보세요.</p>
          </div>
        `);
      } else {
        renderCards(data.content);
      }
      page++;
    } catch (err) {
      toast.error("데이터를 불러오는 데 실패했습니다.");
    } finally {
      isLoading = false;
      $spinner.removeClass("tk-list-loading--active");
    }
  };

  const renderCards = (tickets: any[]) => {
    const html = tickets
      .map((ticket) => {
        const priceStr =
          new Intl.NumberFormat("ko-KR").format(ticket.lowestPrice) + "원";
        const likeClass = ticket.isLiked
          ? "fa-solid fa-heart tk-card__like--active"
          : "fa-regular fa-heart";

        // 날짜 포맷 변환 (yyyy-MM-dd) -> (yyyy.MM.dd)
        const formatYMD = (dateString: string) => dateString.replace(/-/g, ".");
        const dateStr = `${formatYMD(ticket.startDate)} ~ ${formatYMD(ticket.endDate)}`;

        return `
          <article class="tk-card">
              <div class="tk-card__img-box">
                  <a href="/ticket/${ticket.ticketId}">
                      <img class="tk-card__img" src="/file/display?fileName=${ticket.uploadPath}/t_${ticket.uuid}_${ticket.fileName}" alt="${ticket.ticketTitle}">
                  </a>
                  <button type="button" class="tk-card__like-btn" data-id="${ticket.ticketId}" data-status="${ticket.isLiked}">
                      <i class="${likeClass}"></i>
                  </button>
              </div>
              <div class="tk-card__info" onclick="location.href='/ticket/${ticket.ticketId}'">
                  <div class="tk-card__meta">
                      <span class="tk-card__address">${ticket.postAddress}</span>
                      <span class="tk-card__stat"><i class="fa-solid fa-heart" style="color:#8a8a8e;"></i> ${ticket.likeCount}</span>
                  </div>
                  <h3 class="tk-card__title">${ticket.ticketTitle}</h3>
                  <div class="tk-card__bottom">
                      <div class="tk-card__price-box">
                          <span class="tk-card__price-label">최저가</span>
                          <strong class="tk-card__price">${priceStr}</strong>
                      </div>
                      <span class="tk-card__date">${dateStr}</span>
                  </div>
              </div>
          </article>
        `;
      })
      .join("");
    $grid.append(html);
  };

  // 무한 스크롤
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && !isLastPage)
      void fetchTickets(true);
  });
  const target = document.getElementById("scrollTarget");
  if (target) observer.observe(target);

  // 검색
  $searchInput.on("keypress", (e) => {
    if (e.key === "Enter") {
      page = 0;
      void fetchTickets();
    }
  });

  // 카테고리 탭
  $(".tk-cat__item").on("click", function () {
    $(".tk-cat__item").removeClass("tk-cat__item--active");
    $(this).addClass("tk-cat__item--active");
    currentCategory = $(this).data("category");
    page = 0;
    void fetchTickets();
  });

  // 드롭다운 공통 토글
  $(".tk-drop__btn").on("click", function (e) {
    e.stopPropagation();
    const $list = $(this).siblings(".tk-drop__list");
    $(".tk-drop__list").not($list).removeClass("tk-drop__list--active");
    $list.toggleClass("tk-drop__list--active");
  });
  $(document).on("click", () =>
    $(".tk-drop__list").removeClass("tk-drop__list--active"),
  );

  // 정렬/평점 옵션 선택
  $(".tk-drop__item").on("click", function () {
    const $parent = $(this).closest(".tk-drop");
    const val = $(this).data("val");
    const text = $(this).text();

    $parent.find(".tk-drop__item").removeClass("tk-drop__item--active");
    $(this).addClass("tk-drop__item--active");
    $parent.find(".tk-drop__text").text(text);

    if ($parent.attr("id") === "sortBox") {
      currentSort = val;
    } else {
      currentRating = val;
    }

    page = 0;
    void fetchTickets();
  });

  // 좋아요 이벤트
  $grid.on("click", ".tk-card__like-btn", async function (e) {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("로그인이 필요합니다.");
      location.href = "/user/login";
      return;
    }

    const $btn = $(this);
    const id = $btn.data("id");
    const status = $btn.data("status") === true;
    const $icon = $btn.find("i");

    try {
      const res = await ticketService.toggleLike(id, status);
      $btn.data("status", res);
      if (res) {
        $icon
          .removeClass("fa-regular")
          .addClass("fa-solid tk-card__like--active");
      } else {
        $icon
          .removeClass("fa-solid tk-card__like--active")
          .addClass("fa-regular");
      }
    } catch {
      toast.error("처리 실패");
    }
  });

  // 최초 호출
  void fetchTickets();
});
