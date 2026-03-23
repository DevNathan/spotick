import $ from "jquery";
import { toast } from "@/utils/sonner";
import { confirmModal } from "@/utils/confirm";
import { alertModal } from "@/utils/alert";

$(() => {
  const promotionId = $("#promotionId").val() as string;
  const userId = $("#userId").val() as string;
  const isLoggedIn = $("#isLoggedIn").val() === "true";

  // ==========================================
  // 1. 좋아요 처리 로직
  // ==========================================
  const $likeBtn = $("#likeBtn");
  const $likeCount = $("#likeCount");

  // 초기 상태 로드 시 하트 아이콘 채우기 처리
  if ($likeBtn.data("status") === true) {
    $likeBtn
      .addClass("active")
      .find("i")
      .removeClass("fa-regular")
      .addClass("fa-solid");
  }

  $likeBtn.on("click", async function () {
    if (!isLoggedIn) {
      const isConfirm = await confirmModal.show({
        title: "로그인 필요",
        message: "로그인이 필요한 서비스입니다. 로그인 하시겠습니까?",
      });
      if (isConfirm) location.href = "/user/login";
      return;
    }

    const currentStatus = $(this).data("status") as boolean;

    try {
      // 백엔드 구조상 GET 방식으로 status 값을 보내서 반전시킴
      const newStatus = await $.ajax({
        url: `/promotion/api/like?status=${currentStatus}&promotionId=${promotionId}`,
        method: "GET",
      });

      $(this).data("status", newStatus);
      let curVal = parseInt($likeCount.text(), 10);

      if (newStatus) {
        $likeCount.text(curVal + 1);
        $(this)
          .addClass("active")
          .find("i")
          .removeClass("fa-regular")
          .addClass("fa-solid");

        // 💡 핵심: 좋아요 성공 시 toast 띄우기
        toast.success("이 컨텐츠를 좋아합니다.");
      } else {
        $likeCount.text(curVal - 1);
        $(this)
          .removeClass("active")
          .find("i")
          .removeClass("fa-solid")
          .addClass("fa-regular");

        // 💡 핵심: 좋아요 취소 시 toast 띄우기
        toast.success("좋아요를 취소했습니다.");
      }
    } catch (e) {
      toast.error("처리 중 오류가 발생했습니다.");
    }
  });

  // ==========================================
  // 2. 게시글 삭제 로직
  // ==========================================
  $("#deleteBtn").on("click", async () => {
    const isConfirm = await confirmModal.show({
      title: "게시글 삭제",
      message:
        "정말 이 홍보 게시글을 삭제하시겠습니까?<br>삭제 후 복구할 수 없습니다.",
    });

    if (!isConfirm) return;

    try {
      await $.ajax({
        url: `/promotion/api/delete?promotionId=${promotionId}`,
        method: "DELETE",
      });

      await alertModal.show({
        title: "삭제 완료",
        message: "게시글이 성공적으로 삭제되었습니다.",
      });
      location.href = "/promotion";
    } catch (e) {
      toast.error("게시글 삭제에 실패했습니다.");
    }
  });

  // ==========================================
  // 3. 공유하기 (Web Share API 적용)
  // ==========================================
  $("#shareBtn").on("click", async () => {
    const title = document.title;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        console.log("공유가 취소되었거나 실패했습니다.");
      }
    } else {
      // Web Share API를 지원하지 않는 PC 환경 등에서는 클립보드 복사로 대체
      navigator.clipboard.writeText(url).then(() => {
        toast.success("주소가 클립보드에 복사되었습니다.");
      });
    }
  });

  // ==========================================
  // 4. 해당 유저의 다른 컨텐츠 (커스텀 드래그 + 무한 스크롤)
  // ==========================================
  const $track = $("#moreContentsTrack");
  const $spinner = $("#loadingSpinner");
  let page = 0;
  let isLoading = false;
  let isLastPage = false;

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
    slider.addEventListener("mouseleave", () => (isDown = false));
    slider.addEventListener("mouseup", () => (isDown = false));
    slider.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      slider.scrollLeft = scrollLeft - walk;
    });
  };

  enableDragScroll("#moreContentsTrack");

  const loadMoreContents = async () => {
    if (isLoading || isLastPage) return;
    isLoading = true;
    $spinner.show();

    try {
      const response = await $.ajax({
        url: `/promotion/api/list/${userId}/${promotionId}?page=${page}`,
        method: "GET",
      });

      const sliceData = response.data;
      isLastPage = sliceData.last;

      if (sliceData.content.length > 0) {
        const html = sliceData.content
          .map(
            (pro: any) => `
            <a href="/promotion/${pro.promotionId}" class="pd-card">
                <div class="pd-card__img-box">
                    <img class="pd-card__img" src="/file/display?fileName=${pro.thumbnailImage.uploadPath}/t_${pro.thumbnailImage.uuid}_${pro.thumbnailImage.fileName}" alt="${pro.title}">
                </div>
                <h4 class="pd-card__title">${pro.title}</h4>
            </a>
        `,
          )
          .join("");
        $track.append(html);
      }

      // 불러온 컨텐츠가 하나도 없으면 아예 섹션을 가려버린다.
      if (page === 0 && sliceData.content.length === 0) {
        $(".pd-more").hide();
      }

      page++;
    } catch (e) {
      toast.error("컨텐츠를 불러오지 못했습니다.");
    } finally {
      isLoading = false;
      $spinner.hide();
    }
  };

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && !isLastPage) {
      void loadMoreContents();
    }
  });

  const scrollTarget = document.getElementById("scrollTarget");
  if (scrollTarget) observer.observe(scrollTarget);

  void loadMoreContents();
});
