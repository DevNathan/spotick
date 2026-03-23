import $ from "jquery";
import { getTimeGapFromNow } from "@/utils/time-utils";

/**
 * 서버로부터 수신하는 개별 알림 데이터의 규격을 정의하는 인터페이스입니다.
 */
interface NoticeInfo {
  noticeId: number;
  title: string;
  content: string;
  link: string;
  createdDate: string;
  noticeStatus: "READ" | "UNREAD" | "DELETED";
}

/**
 * 알림 목록 조회 API의 응답 데이터 규격을 정의하는 인터페이스입니다.
 */
interface NoticeResponse {
  data: NoticeInfo[];
  message?: string;
}

$(() => {
  const $notificationBtn = $("#notification");
  const $notificationPopOver = $(".notification");
  const $usermenuPopOver = $(".user-menu");
  const $footerHome = $("#footerHome");
  const $notificationBody = $(".notification__body");
  const $notificationReload = $("#notificationReload");
  const $notificationCount = $("#notificationCount");
  const $notificationLoadingMark = $("#notificationLoadingMark");
  const $currentType = $("#currentContent");

  /**
   * 상단 헤더의 컨텐츠 타입(장소/티켓)을 시각적으로 전환하는 기능을 수행합니다.
   * @param type 전환할 컨텐츠의 타입 문자열 ('place' 또는 'ticket')
   */
  const toggleContent = (type: string | null): void => {
    if (type === "ticket") {
      $currentType
        .removeClass("header__type-current--place")
        .addClass("header__type-current--ticket")
        .text("티켓");
    } else if (type === "place") {
      $currentType
        .removeClass("header__type-current--ticket")
        .addClass("header__type-current--place")
        .text("장소");
    }
  };

  /**
   * 지정된 타입에 맞추어 메인 페이지로 이동합니다.
   * @param type 이동할 메인 페이지의 타입 문자열 ('place' 또는 'ticket')
   */
  const getMainPageByType = (type: string | null): void => {
    window.location.href = type === "place" ? "/place" : "/ticket";
  };

  /**
   * 현재 페이지의 URL 경로를 분석하여 활성화된 컨텐츠 타입을 반환합니다.
   * @returns 활성화된 컨텐츠 타입 문자열 ('place', 'ticket' 또는 null)
   */
  const checkUrlType = (): string | null => {
    const currentUri = window.location.pathname;
    if (currentUri === "/") return "place";

    const firstSegment = currentUri.split("/")[1];
    return firstSegment === "place" || firstSegment === "ticket"
      ? firstSegment
      : null;
  };

  /**
   * 사용자 메뉴 팝오버의 표시 상태를 전환합니다.
   * 알림 팝오버가 열려있는 경우 이를 닫고 사용자 메뉴를 표시합니다.
   */
  const toggleUsermenu = (): void => {
    $notificationPopOver.removeClass("notification--show");
    $usermenuPopOver.toggleClass("user-menu--show");
  };

  /**
   * 알림 팝오버의 표시 상태를 전환합니다.
   * 사용자 메뉴 팝오버가 열려있는 경우 이를 닫고 알림 메뉴를 표시합니다.
   */
  const toggleNotification = (): void => {
    $usermenuPopOver.removeClass("user-menu--show");
    $notificationPopOver.toggleClass("notification--show");
  };

  /**
   * 푸터 영역의 홈 팝오버 메뉴 표시 상태를 전환합니다.
   */
  const toggleFooterHome = (): void => {
    $(".footer__popover").toggleClass("footer__popover--show");
  };

  /**
   * 알림 데이터 조회, 출력 및 상태 업데이트를 관리하는 객체입니다.
   */
  const notificationService = {
    isLoading: false,

    /**
     * 서버에 알림 목록을 요청하고 화면에 렌더링합니다.
     */
    requestNotificationList(): void {
      if (this.isLoading) return;

      this.isLoading = true;
      $notificationBody.empty();

      $notificationLoadingMark.addClass("show");

      setTimeout(() => {
        $.ajax({
          url: "/notice/api/list",
          method: "GET",
          dataType: "json",
        })
          .done((res: NoticeResponse) => {
            if (res.data && res.data.length > 0) {
              this.loadNotificationList(res.data);
            } else {
              this.loadNoContent();
            }
          })
          .fail((err) => {
            console.error(
              "알림 목록을 불러오는 중 오류가 발생하였습니다.",
              err,
            );
          })
          .always(() => {
            this.isLoading = false;
            $notificationLoadingMark.removeClass("show");
          });
      }, 500);
    },

    /**
     * 수신된 알림 데이터를 기반으로 HTML 요소를 생성하여 DOM에 추가합니다.
     * @param data 렌더링할 알림 데이터 배열
     */
    loadNotificationList(data: NoticeInfo[]): void {
      if (data.length === 0) return;

      let anyUnread = false;
      $notificationCount.text(data.length);

      data.forEach((notification: NoticeInfo) => {
        const html = `
                    <div class="notification__item" id="${notification.noticeId}" data-link="${notification.link}">
                        <div class="notification__item-top">
                            <div class="notification__title">${notification.title}</div>
                            <div class="notification__date">${getTimeGapFromNow(notification.createdDate)}</div>
                        </div>
                        <div class="notification__item-bottom">
                            <div class="notification__content">${notification.content}</div>
                            <button class="notification__btn" type="button">삭제</button>
                        </div>
                    </div>
                `;

        if (notification.noticeStatus === "UNREAD") anyUnread = true;
        $notificationBody.append(html);
      });

      if (anyUnread) {
        $notificationBtn.addClass("header__icon-btn--alarm");
      } else {
        $notificationBtn.removeClass("header__icon-btn--alarm");
      }
    },

    /**
     * 특정 알림의 상태(읽음 또는 삭제)를 업데이트하기 위해 서버에 요청을 전송합니다.
     * @param noticeId 상태를 변경할 알림의 고유 식별자
     * @param status 변경할 상태 값 ('read' 또는 'deleted')
     */
    requestUpdateStatus(
      noticeId: string | number,
      status: "read" | "deleted",
    ): void {
      const condition = status === "read" ? "READ" : "DELETED";

      $.ajax({
        url: "/notice/api/updateStatus",
        method: "PATCH",
        contentType: "application/json",
        data: JSON.stringify({
          noticeId: noticeId,
          noticeStatus: condition,
        }),
      })
        .done(() => {
          this.deleteNotificationHtml(noticeId.toString());
        })
        .fail((err) => {
          console.error("알림 상태 업데이트 중 오류가 발생하였습니다.", err);
        });
    },

    /**
     * 화면에서 특정 알림 요소를 제거하고 알림 개수 배지를 갱신합니다.
     * @param id 제거할 알림 요소의 고유 식별자
     */
    deleteNotificationHtml(id: string): void {
      const $targetNotification = $notificationBody.find(
        `.notification__item[id="${id}"]`,
      );
      $targetNotification.remove();

      const currentCount = parseInt($notificationCount.text() || "0", 10) - 1;
      $notificationCount.text(currentCount > 0 ? currentCount.toString() : "");

      if ($notificationBody.children().length === 0) {
        $notificationBtn.removeClass("header__icon-btn--alarm");
        this.loadNoContent();
      }
    },

    /**
     * 알림이 존재하지 않을 때 표시할 기본 안내 문구를 렌더링합니다.
     */
    loadNoContent(): void {
      $notificationBody.html(`
                <div class="notification__empty">
                    <span>알림이 없습니다.</span>
                </div>
            `);
    },
  };

  /**
   * 페이지 로드 시 필요한 초기화 작업 및 이벤트 바인딩을 수행합니다.
   */
  const init = (): void => {
    toggleContent(checkUrlType());

    $(".header__type-btn").on("click", async function () {
      const type = $(this).data("type");
      toggleContent(type);
      await new Promise((resolve) => setTimeout(resolve, 300));
      getMainPageByType(type);
    });

    $("#usermenu").on("click", toggleUsermenu);
    $notificationBtn.on("click", toggleNotification);
    $notificationReload.on("click", () =>
      notificationService.requestNotificationList(),
    );
    $footerHome.on("click", toggleFooterHome);

    $notificationBody.on("click", ".notification__btn", function (e) {
      e.stopPropagation();
      const noticeId = $(this).closest(".notification__item").attr("id");
      if (noticeId) {
        notificationService.requestUpdateStatus(noticeId, "deleted");
      }
    });

    $notificationBody.on("click", ".notification__item", function () {
      const link = $(this).data("link");
      if (link) window.location.href = link;
    });

    if ($notificationBtn.length > 0) {
      notificationService.requestNotificationList();
    }
  };

  init();
});
