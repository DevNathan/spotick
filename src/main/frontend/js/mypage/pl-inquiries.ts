import $ from "jquery";
import { inquiryService } from "@/service/inquiry-service";
import { alertModal } from "@/utils/alert";

/**
 * 호스트 미답변 문의 데이터 인터페이스입니다.
 */
export interface UnansweredInquiryDto {
  id: number;
  inquiryTitle: string;
  content: string;
  nickname: string;
  createdDate: string;
}

$(() => {
  const placeIdStr = $("#placeId").val() as string;
  const placeId = Number(placeIdStr);

  if (!placeId) {
    console.error("장소 ID 식별 불가.");
    return;
  }

  let currentPage = 0;
  let currentInquiryId: number | null = null;

  const $inquiryList = $("#inquiryList");
  const $loadMoreBtn = $("#loadMoreBtn");
  const $replyModal = $("#replyModal");
  const $replyContent = $("#replyContent");

  /**
   * 특정 페이지의 문의 목록을 로드하여 화면에 렌더링합니다.
   * @param {number} page 조회할 페이지 번호
   */
  const loadInquiries = (page: number): void => {
    inquiryService
      .getPlaceInquiriesOfHost(placeId, page)
      .done((res: any) => {
        const inquiries: UnansweredInquiryDto[] = res.content;

        if (page === 0 && inquiries.length === 0) {
          $inquiryList.html(
            '<div class="pl-inq__empty">등록된 문의 내역이 없습니다.</div>',
          );
          $loadMoreBtn.hide();
          return;
        }

        renderInquiries(inquiries);

        if (!res.last) {
          $loadMoreBtn.show();
        } else {
          $loadMoreBtn.hide();
        }
      })
      .fail((_xhr, _status, error) => {
        console.error("데이터 로드 실패:", error);
        void alertModal.show({
          title: "오류",
          message: "문의 목록을 불러오지 못했습니다.",
          type: "error",
        });
      });
  };

  /**
   * 문의 목록 HTML을 생성하여 DOM 리스트에 추가합니다.
   * @param {UnansweredInquiryDto[]} inquiries 문의 데이터 배열
   */
  const renderInquiries = (inquiries: UnansweredInquiryDto[]): void => {
    let html = "";
    inquiries.forEach((inq) => {
      const date = inq.createdDate
        ? inq.createdDate.split("T")[0].replace(/-/g, ".")
        : "";
      html += `
                <article class="pl-inq__card" id="inq-${inq.id}">
                    <div class="pl-inq__card-header">
                        <span class="pl-inq__card-title">${inq.inquiryTitle} <small>${inq.nickname}</small></span>
                        <span class="pl-inq__card-date">${date}</span>
                    </div>
                    <div class="pl-inq__card-body">
                        ${inq.content}
                    </div>
                    <button type="button" class="pl-inq__reply-btn action-reply" data-id="${inq.id}">
                        답변 달기
                    </button>
                </article>
            `;
    });
    $inquiryList.append(html);
  };

  $loadMoreBtn.on("click", () => {
    currentPage++;
    loadInquiries(currentPage);
  });

  $inquiryList.on("click", ".action-reply", function () {
    currentInquiryId = Number($(this).data("id"));
    $replyContent.val("");
    $replyModal.addClass("is-active");
  });

  $("#modalCloseBtn").on("click", () => {
    $replyModal.removeClass("is-active");
    currentInquiryId = null;
  });

  $("#replySubmitBtn").on("click", () => {
    const content = $replyContent.val() as string;

    /**
     * 답변 내용의 길이가 10자 미만인지 검증합니다.
     * 공백을 제외한 실제 입력값을 기준으로 확인하여 무의미한 입력을 방지합니다.
     */
    if (content.trim().length < 10) {
      void alertModal.show({
        title: "알림",
        message: "답변 내용은 최소 10자 이상 작성해야 합니다.",
      });
      return;
    }

    if (currentInquiryId === null) return;

    inquiryService
      .responsePlaceInquiry(placeId, currentInquiryId, content)
      .done(() => {
        alertModal
          .show({ title: "성공", message: "답변이 정상적으로 등록되었습니다." })
          .then(() => {
            $replyModal.removeClass("is-active");
            $(`#inq-${currentInquiryId}`).remove();
            currentInquiryId = null;

            if ($inquiryList.children(".pl-inq__card").length === 0) {
              $inquiryList.html(
                '<div class="pl-inq__empty">등록된 문의 내역이 없습니다.</div>',
              );
            }
          });
      })
      .fail((_xhr, _status, error) => {
        console.error("답변 등록 실패:", error);
        void alertModal.show({
          title: "오류",
          message: "답변 등록에 실패했습니다.",
          type: "error",
        });
      });
  });

  loadInquiries(currentPage);
});
