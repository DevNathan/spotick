import $ from "jquery";
import flatpickr from "flatpickr";
import { Korean } from "flatpickr/dist/l10n/ko.js";
import { toast } from "@/utils/sonner";
import { alertModal } from "@/utils/alert";
import { confirmModal } from "@/utils/confirm";

/**
 * 호스트가 티켓 문의를 확인하고 답변하며, 날짜별 판매 현황을 조회하는 통합 모듈입니다.
 */
$(() => {
  const ticketId = $("#ticketId").val() as string;
  const startDate = $("#startDate").val() as string;
  const endDate = $("#endDate").val() as string;

  const $inquiryList = $("#inquiryList");
  const $spinner = $("#loadingSpinner");
  const $gradeList = $("#gradeList");

  let page = 0;
  let isLastPage = false;
  let isLoading = false;

  // ==========================================
  // 1. 날짜 선택 및 판매 현황 (Flatpickr)
  // ==========================================
  flatpickr("#salesDatePicker", {
    locale: Korean,
    inline: true,
    minDate: startDate,
    maxDate: endDate,
    defaultDate: startDate,
    dateFormat: "Y-m-d",
    onChange: function (_, dateStr) {
      $("#selectedDate").val(dateStr);
      loadGrades(dateStr);
    },
  });

  const loadGrades = async (dateStr: string) => {
    try {
      const res = await $.ajax({
        url: `/ticket/api/getGrades?ticketId=${ticketId}&date=${dateStr}`,
        method: "GET",
      });

      const grades = res.data || [];
      $gradeList.empty();

      if (grades.length === 0) {
        $gradeList.html(
          '<tr><td colspan="4" class="ti-empty">해당 날짜에 판매 정보가 없습니다.</td></tr>',
        );
        return;
      }

      const html = grades
        .map(
          (g: any) => `
                <tr>
                    <td>${g.gradeName}</td>
                    <td>${new Intl.NumberFormat("ko-KR").format(g.price)}</td>
                    <td style="color:#3c82fa; font-weight:700;">${g.sold}</td>
                    <td>${g.maxPeople}</td>
                </tr>
            `,
        )
        .join("");

      $gradeList.html(html);
    } catch (e) {
      toast.error("판매 현황을 불러오지 못했습니다.");
    }
  };

  // 초기 렌더링 시 시작일 기준 판매 현황 로드
  loadGrades(startDate);

  // ==========================================
  // 2. 문의 목록 무한 스크롤
  // ==========================================
  const loadInquiries = async (isLoadMore = false) => {
    if (isLoading || (isLoadMore && isLastPage)) return;
    isLoading = true;
    $spinner.show();

    try {
      const response = await $.ajax({
        url: `/tickets/api/inquiry/${ticketId}/list?page=${page}`,
        method: "GET",
      });

      const pageData = response.data;
      const items = pageData.content || [];

      isLastPage = pageData.empty || pageData.last;

      if (items.length === 0 && !isLoadMore) {
        $inquiryList.html(
          '<div class="ti-empty">아직 등록된 문의가 없습니다.</div>',
        );
      } else {
        renderInquiries(items);
      }
      page++;
    } catch (e) {
      console.error(e);
      toast.error("문의 목록을 불러오지 못했습니다.");
    } finally {
      isLoading = false;
      $spinner.hide();
    }
  };

  const renderInquiries = (inquiries: any[]) => {
    const html = inquiries
      .map(
        (item: any) => `
            <article class="ti-card" id="inq-${item.inquiryId}">
                <div class="ti-card__header">
                    <span class="ti-card__writer">${item.questionerNickname}</span>
                    <span class="ti-card__date">${item.questionDate || ""}</span>
                </div>
                <h4 class="ti-card__title">${item.inquiryTitle}</h4>
                <p class="ti-card__content">${item.inquiryContent}</p>
                
                <div class="ti-card__actions">
                    <button type="button" class="ti-btn ti-btn--reply action-reply" data-id="${item.inquiryId}">
                        답변하기
                    </button>
                </div>
            </article>
        `,
      )
      .join("");
    $inquiryList.append(html);
  };

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && !isLastPage) {
      void loadInquiries(true);
    }
  });

  const scrollTarget = document.getElementById("scrollTarget");
  if (scrollTarget) observer.observe(scrollTarget);

  loadInquiries();

  // ==========================================
  // 3. 답변 작성 모달 제어
  // ==========================================
  const $replyModal = $("#replyModal");
  const $replyContent = $("#replyContent");
  const $replySubmitBtn = $("#replySubmitBtn");
  const $targetInquiryId = $("#targetInquiryId");

  $inquiryList.on("click", ".action-reply", function () {
    const inquiryId = $(this).data("id");
    $targetInquiryId.val(inquiryId);
    $replyContent.val("");
    $("#replyLength").text("0");
    $replySubmitBtn.prop("disabled", true);
    $replyModal.addClass("is-active");
  });

  $("#replyModalClose").on("click", () => $replyModal.removeClass("is-active"));

  $replyContent.on("input", function () {
    const val = $(this).val() as string;
    if (val.length > 200) $(this).val(val.slice(0, 200));
    const len = $(this).val()?.toString().length || 0;
    $("#replyLength").text(len);
    $replySubmitBtn.prop("disabled", len < 10);
  });

  $replySubmitBtn.on("click", async () => {
    const inquiryId = $targetInquiryId.val();
    const responseContent = $replyContent.val() as string;

    const isConfirm = await confirmModal.show({
      title: "답변 등록",
      message: "답변을 등록하시겠습니까?",
    });
    if (!isConfirm) return;

    try {
      await $.ajax({
        // 컨트롤러의 @RequestMapping("/inquiries/api") + @PatchMapping("/response-tiin")에 정확히 맞춘다.
        url: `/inquiries/api/response-tiin`,
        method: "PATCH", // POST가 아닌 PATCH로 변경
        contentType: "application/json",
        data: JSON.stringify({
          id: parseInt(ticketId, 10), // DTO의 필드명인 'id'로 전송
          inquiryId: parseInt(inquiryId as string, 10),
          response: responseContent,
        }),
      });

      await alertModal.show({
        title: "성공",
        message: "답변이 등록되었습니다.",
      });

      $replyModal.removeClass("is-active");
      $(`#inq-${inquiryId}`).remove();

      if ($(".ti-card").length === 0) {
        $inquiryList.html(
          '<div class="ti-empty">아직 등록된 문의가 없습니다.</div>',
        );
      }
    } catch (e: any) {
      const errorMsg = e.responseJSON?.message || "답변 등록에 실패했습니다.";
      toast.error(errorMsg);
    }
  });
});
