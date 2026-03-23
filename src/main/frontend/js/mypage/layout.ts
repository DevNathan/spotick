import $ from "jquery";

/**
 * 마이페이지 공통 레이아웃의 UI 인터랙션을 제어하는 모듈입니다.
 */
$(() => {
  /**
   * 모바일 환경(가로 스크롤 메뉴)에서 활성화된 탭이 화면 중앙에 보이도록 스크롤 위치를 조정합니다.
   */
  const adjustMobileScroll = (): void => {
    const $sidebar = $(".mypage-sidebar__sticky");
    const $activeItem = $(".mypage-sidebar__item--active");

    if (window.innerWidth <= 992 && $activeItem.length > 0) {
      const scrollLeft =
        $activeItem.position().left +
        $sidebar.scrollLeft()! -
        $sidebar.width()! / 2 +
        $activeItem.width()! / 2;
      $sidebar.animate({ scrollLeft: scrollLeft }, 300);
    }
  };

  // 초기 진입 시 및 리사이즈 시 스크롤 조정 트리거
  adjustMobileScroll();
  $(window).on("resize", adjustMobileScroll);
});
