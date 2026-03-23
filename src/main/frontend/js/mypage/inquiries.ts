import $ from "jquery";
import { inquiryService } from "@/service/inquiry-service";
import { renderPagination } from "@/utils/pagination";
import { confirmModal } from "@/utils/confirm";
import { alertModal } from "@/utils/alert";
import { PageResponse } from "@/global/types/page-type";

/**
 * 주소 정보 인터페이스입니다.
 */
export interface PostAddress {
  address: string;
  addressDetail: string;
}

/**
 * 파일 정보 인터페이스입니다.
 */
export interface FileDto {
  uploadPath: string;
  uuid: string;
  fileName: string;
}

/**
 * 장소 문의 내역 DTO 인터페이스입니다.
 */
export interface PlaceInquiryListDto {
  id: number;
  inquiryId: number;
  placeTitle: string;
  price: number;
  placeAddress: PostAddress;
  placeFileDto: FileDto;
  evalAvg: number;
  evalCount: number;
  bookmarkCount: number;
  inquiryTitle: string;
  content: string;
  response: string;
  responded: boolean;
}

/**
 * 티켓 문의 내역 DTO 인터페이스입니다.
 */
export interface TicketInquiryListDto {
  id: number;
  inquiryId: number;
  ticketTitle: string;
  inquiryTitle: string;
  content: string;
  response: string;
  responded: boolean;
}

export type InquiryDto = PlaceInquiryListDto | TicketInquiryListDto;

$(() => {
  let currentType: "place" | "ticket" = "place";
  let inquiriesData: InquiryDto[] = [];

  const $placeTab = $("#placeTab");
  const $ticketTab = $("#ticketTab");
  const $container = $("#inquiryContainer");
  const $pagination = $("#paginationContainer");
  const $loading = $("#loadingMark");
  const $modalOverlay = $("#inqDetailModal");
  const $modalContent = $("#inqModalContent");

  // ==========================================
  // 1. 데이터 로드 및 분기 처리
  // ==========================================
  const loadPage = async (page: number) => {
    $loading.addClass("show");
    try {
      let res: PageResponse<any>;

      if (currentType === "place") {
        res = await inquiryService.getPlaceInquiriesOfUser(page);
      } else {
        res = await inquiryService.getTicketInquiriesOfUser(page);
      }

      // 수정된 부분: res.data 프로퍼티 접근
      if (!res || !res.data || res.data.empty) {
        $container.html('<div class="inq-empty">문의 내역이 없습니다.</div>');
        $pagination.empty();
        return;
      }

      inquiriesData = res.data.content;
      renderList(inquiriesData);

      // 모듈화된 글로벌 페이지네이션 호출
      renderPagination($pagination, res.pagination, (selectedPage) => {
        void loadPage(selectedPage);
      });
    } catch (e) {
      console.error(e);
      $container.html(
        '<div class="inq-empty">데이터를 불러오지 못했습니다.</div>',
      );
    } finally {
      $loading.removeClass("show");
    }
  };

  // ==========================================
  // 2. 리스트 렌더링 (카드 레이아웃 직접 생성)
  // ==========================================
  const renderList = (inquiries: any[]) => {
    const html = inquiries
      .map((item, idx) => {
        const id = item.inquiryId || item.id;
        const title = item.inquiryTitle || "문의 내용";
        const date = item.createdDate || ""; // 백엔드 DTO에 날짜가 없다면 빈 문자열 처리

        // 백엔드 DTO 프로퍼티명인 isResponded를 기준으로 판별
        const isResponded = item.isResponded || item.responded;

        const statusClass = isResponded
          ? "inq-card__status--done"
          : "inq-card__status--wait";
        const statusText = isResponded ? "답변 완료" : "답변 대기";

        return `
        <article class="inq-card" id="inq-${id}">
          <div class="inq-card__header">
            <div>
              <h3 class="inq-card__title">${title}</h3>
              <div class="inq-card__date">${date}</div>
            </div>
            <span class="inq-card__status ${statusClass}">${statusText}</span>
          </div>
          <div class="inq-card__body">${item.content || ""}</div>
          <div class="inq-card__footer">
            <button class="inq-btn inq-btn--outline btn-detail" data-idx="${idx}" type="button">상세보기</button>
            <button class="inq-btn inq-btn--danger btn-delete" data-id="${id}" type="button">삭제</button>
          </div>
        </article>
      `;
      })
      .join("");

    $container.html(html);
  };

  // ==========================================
  // 3. 이벤트 바인딩
  // ==========================================
  $placeTab.on("click", () => {
    if (currentType === "place") return;
    currentType = "place";
    $ticketTab.removeClass("active");
    $placeTab.addClass("active");
    void loadPage(1);
  });

  $ticketTab.on("click", () => {
    if (currentType === "ticket") return;
    currentType = "ticket";
    $placeTab.removeClass("active");
    $ticketTab.addClass("active");
    void loadPage(1);
  });

  $container.on("click", ".btn-detail", function () {
    const idx = $(this).data("idx");
    const item = inquiriesData[idx];

    const html = `
      <div class="inq-detail-box">
        <div class="inq-detail-label">나의 문의</div>
        <div class="inq-detail-text">${item.content || "내용 없음"}</div>
      </div>
      ${
        item.responded && item.response
          ? `
      <div class="inq-detail-box">
        <div class="inq-detail-label host">호스트 답변</div>
        <div class="inq-detail-text">${item.response}</div>
      </div>
      `
          : `
      <div class="inq-detail-box">
        <div class="inq-detail-label host">호스트 답변</div>
        <div class="inq-detail-text" style="color: #8a8a8e;">아직 답변이 등록되지 않았습니다.</div>
      </div>
      `
      }
    `;

    $modalContent.html(html);
    $modalOverlay.addClass("is-active");
  });

  $("#inqModalClose").on("click", () => {
    $modalOverlay.removeClass("is-active");
  });

  $container.on("click", ".btn-delete", async function () {
    const id = $(this).data("id");
    const isConfirm = await confirmModal.show({
      title: "문의 삭제",
      message: "해당 문의 내역을 삭제하시겠습니까?",
    });

    if (isConfirm) {
      let res;
      if (currentType === "place") {
        res = await inquiryService.deletePlaceInquiry(id);
      } else {
        res = await inquiryService.deleteTicketInquiry(id);
      }

      if (res.success) {
        await alertModal.show({ title: "성공", message: res.message });
        void loadPage(
          Number($pagination.find(".pagination-btns .active").text() || 1),
        );
      } else {
        await alertModal.show({
          title: "실패",
          message: res.message,
          type: "error",
        });
      }
    }
  });

  // 초기화
  void loadPage(1);
});
