import $ from "jquery";
import { PaginationData } from "@/global/types/page-type";

/**
 * 전역 페이지네이션 렌더링 및 이벤트 바인딩 함수입니다.
 * @param $container 페이지네이션이 그려질 jQuery 컨테이너 객체
 * @param data 서버로부터 응답받은 페이지네이션 정보
 * @param onPageClick 페이지 버튼 클릭 시 실행할 콜백 함수 (page 번호를 인자로 받음)
 */
export const renderPagination = (
  $container: JQuery,
  data: PaginationData,
  onPageClick: (page: number) => void,
) => {
  const {
    hasPrevBlock,
    hasNextBlock,
    startPage,
    endPage,
    lastPage,
    currentPage,
  } = data;

  let html = `<div class="global-pagination">`;

  if (hasPrevBlock) {
    html += `
      <div class="global-pagination__group global-pagination__group--prev">
        <a class="global-pagination__btn" data-page="1" title="맨 처음">
          <i class="fa-solid fa-angles-left global-pagination__icon"></i>
        </a>
        <a class="global-pagination__btn" data-page="${startPage - 1}" title="이전">
          <i class="fa-solid fa-angle-left global-pagination__icon"></i>
        </a>
      </div>
    `;
  }

  html += `<div class="global-pagination__group global-pagination__group--body">`;
  for (let i = startPage; i <= endPage; i++) {
    const activeClass =
      i === currentPage ? "global-pagination__btn--active" : "";
    html += `
        <a class="global-pagination__btn ${activeClass}" data-page="${i}">${i}</a>
    `;
  }
  html += `</div>`;

  if (hasNextBlock) {
    html += `
      <div class="global-pagination__group global-pagination__group--next">
        <a class="global-pagination__btn" data-page="${endPage + 1}" title="다음">
          <i class="fa-solid fa-angle-right global-pagination__icon"></i>
        </a>
        <a class="global-pagination__btn" data-page="${lastPage}" title="맨 끝">
          <i class="fa-solid fa-angles-right global-pagination__icon"></i>
        </a>
      </div>
    `;
  }

  html += `</div>`;

  $container.html(html);

  $container
    .off("click", ".global-pagination__btn")
    .on("click", ".global-pagination__btn", function (e) {
      e.preventDefault();
      const page = $(this).data("page");
      if (page && page !== currentPage) {
        onPageClick(Number(page));
      }
    });
};
