import $ from "jquery";
import flatpickr from "flatpickr";
import { Korean } from "flatpickr/dist/l10n/ko.js";
import { toast } from "@/utils/sonner";
import { alertModal } from "@/utils/alert";
import { confirmModal } from "@/utils/confirm";
import { payService } from "@/service/bootpay";

declare const kakao: any;

$(() => {
  const isLoggedIn = $("#isLoggedIn").val() === "true";
  const ticketId = $("#ticketId").val() as string;

  const $navItems = $(".td-nav__item");
  const $sections = $(".td-section");

  // ==========================================
  // 1. 카카오맵 연동
  // ==========================================
  const initMap = () => {
    if (typeof kakao === "undefined" || !kakao.maps) return;
    kakao.maps.load(() => {
      const lat = parseFloat($("#ticketLat").val() as string);
      const lng = parseFloat($("#ticketLng").val() as string);
      const container = document.getElementById("map");
      if (!container) return;

      const position = new kakao.maps.LatLng(lat, lng);
      const map = new kakao.maps.Map(container, { center: position, level: 3 });
      new kakao.maps.Marker({ position, map });
    });
  };
  initMap();

  // ==========================================
  // 2. 스크롤 스파이 & 네비게이션
  // ==========================================
  $navItems.on("click", function () {
    const target = $(this).data("target");
    const offset = $(`#${target}`).offset()?.top || 0;
    window.scrollTo({ top: offset - 100, behavior: "smooth" });
  });

  $(window).on("scroll", function () {
    const scrollTop = $(this).scrollTop()! + 120;
    $sections.each(function () {
      if (scrollTop >= $(this).offset()!.top) {
        const id = $(this).attr("id");
        $navItems.removeClass("active");
        $(`.td-nav__item[data-target="${id}"]`).addClass("active");
      }
    });
  });

  // ==========================================
  // 3. 북마크(좋아요) 연동
  // ==========================================
  $("#likeBtn").on("click", async function () {
    if (!isLoggedIn) {
      if (
        await confirmModal.show({
          title: "알림",
          message: "로그인 하시겠습니까?",
        })
      ) {
        location.href = "/user/login";
      }
      return;
    }
    const $btn = $(this);
    const isChecked = $btn.attr("data-status") === "true";
    const $icon = $btn.find("i");
    const $count = $("#likeCount");

    try {
      // 기존 likeFetch.js에 있던 내용을 직접 AJAX로 교체
      const res = await $.ajax({
        url: `/like?status=${isChecked}&ticketId=${ticketId}`,
        method: "GET",
      });

      $btn.attr("data-status", res.toString());
      let currentCount = parseInt($count.text() || "0", 10);

      if (res) {
        $icon
          .removeClass("fa-regular")
          .addClass("fa-solid td-like-btn--active");
        $count.text(currentCount + 1);
        toast.success("북마크 되었습니다.");
      } else {
        $icon
          .removeClass("fa-solid td-like-btn--active")
          .addClass("fa-regular");
        $count.text(Math.max(0, currentCount - 1));
        toast.success("북마크 취소되었습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    }
  });

  // ==========================================
  // 4. Flatpickr & 등급 선택 및 결제
  // ==========================================
  const startStr = $("#startDate").val() as string;
  const endStr = $("#endDate").val() as string;

  flatpickr("#datePickerWrapper", {
    locale: Korean,
    inline: true,
    minDate: startStr,
    maxDate: endStr,
    dateFormat: "Y-m-d",
    onChange: async function (_, dateStr) {
      $("#selectedDate").val(dateStr);
      loadGrades(dateStr);
    },
  });

  const loadGrades = async (dateStr: string) => {
    try {
      // 기존 ticketService.getGrades API 호출
      const res = await $.ajax({
        url: `/ticket/api/getGrades?ticketId=${ticketId}&date=${dateStr}`,
        method: "GET",
      });

      const grades = res.data || [];
      const $gradeList = $("#gradeList").empty();

      if (grades.length === 0) {
        $gradeList.html(
          '<p style="color:#8a8a8e; text-align:center; padding: 20px 0;">해당 날짜에 예매 가능한 티켓이 없습니다.</p>',
        );
        $("#gradeContainer").show();
        updateTotal();
        return;
      }

      grades.forEach((g: any) => {
        // g = { gradeId, gradeName, price, sold, maxPeople }
        const remain = g.maxPeople - g.sold;
        const priceFmt = new Intl.NumberFormat("ko-KR").format(g.price);

        $gradeList.append(`
          <div class="td-grade-item" data-id="${g.gradeId}" data-price="${g.price}" data-remain="${remain}">
            <div class="td-grade-item__info">
              <span class="td-grade-item__name">${g.gradeName}</span>
              <span class="td-grade-item__price">${priceFmt}원 (잔여: ${remain}명)</span>
            </div>
            <div class="td-grade-item__ctr">
              <button type="button" class="td-grade-item__btn action-minus" disabled>-</button>
              <input type="text" class="td-grade-item__count" value="0" readonly>
              <button type="button" class="td-grade-item__btn action-plus" ${remain <= 0 ? "disabled" : ""}>+</button>
            </div>
          </div>
        `);
      });

      $("#gradeContainer").show();
      updateTotal();
    } catch (e) {
      toast.error("등급 정보를 불러오지 못했습니다.");
    }
  };

  $("#gradeList").on("click", ".action-plus", function () {
    const $item = $(this).closest(".td-grade-item");
    const $count = $item.find(".td-grade-item__count");
    const remain = parseInt($item.data("remain"), 10);
    let val = parseInt($count.val() as string, 10);

    if (val < remain) {
      val++;
      $count.val(val);
      $item.find(".action-minus").prop("disabled", false);
      if (val >= remain) $(this).prop("disabled", true);
      updateTotal();
    }
  });

  $("#gradeList").on("click", ".action-minus", function () {
    const $item = $(this).closest(".td-grade-item");
    const $count = $item.find(".td-grade-item__count");
    let val = parseInt($count.val() as string, 10);

    if (val > 0) {
      val--;
      $count.val(val);
      $item.find(".action-plus").prop("disabled", false);
      if (val <= 0) $(this).prop("disabled", true);
      updateTotal();
    }
  });

  const updateTotal = () => {
    let total = 0;
    let totalQty = 0;
    $(".td-grade-item").each(function () {
      const price = parseInt($(this).data("price"), 10);
      const qty = parseInt(
        $(this).find(".td-grade-item__count").val() as string,
        10,
      );
      total += price * qty;
      totalQty += qty;
    });

    $("#totalPriceText").text(
      new Intl.NumberFormat("ko-KR").format(total) + "원",
    );
    $("#purchaseBtn").prop("disabled", totalQty === 0);
  };

  // 구매하기 (Bootpay 연동)
  $("#purchaseBtn").on("click", async () => {
    if (!isLoggedIn) {
      if (
        await confirmModal.show({
          title: "알림",
          message: "로그인 하시겠습니까?",
        })
      ) {
        location.href = "/user/login";
      }
      return;
    }

    const selectedDate = $("#selectedDate").val() as string;
    const ticketOrderDetailDtoList: any[] = [];

    $(".td-grade-item").each(function () {
      const qty = parseInt(
        $(this).find(".td-grade-item__count").val() as string,
        10,
      );
      if (qty > 0) {
        ticketOrderDetailDtoList.push({
          gradeId: $(this).data("id"),
          quantity: qty,
        });
      }
    });

    if (ticketOrderDetailDtoList.length === 0) return;

    // Bootpay 결제 임시저장 후 진행
    payService.requestTicketPaymentSave(
      ticketId,
      selectedDate,
      ticketOrderDetailDtoList,
      payService.payTickets,
    );
  });

  // ==========================================
  // 5. 문의(QnA) 로직
  // ==========================================
  const $inquiryModal = $("#inquiryModal");
  const $inquiryTitle = $("#inquiryTitle");
  const $inquiryContent = $("#inquiryContent");
  const $inquirySubmitBtn = $("#inquirySubmitBtn");

  $("#inquiryOpenBtn").on("click", async () => {
    if (!isLoggedIn) {
      if (
        await confirmModal.show({
          title: "알림",
          message: "로그인 하시겠습니까?",
        })
      ) {
        location.href = "/user/login";
      }
      return;
    }
    $inquiryModal.addClass("is-active");
  });

  $("#inquiryCloseBtn").on("click", () =>
    $inquiryModal.removeClass("is-active"),
  );

  $inquiryContent.add($inquiryTitle).on("input", () => {
    const len = $inquiryContent.val()?.toString().length || 0;
    $("#inquiryLength").text(len);
    $inquirySubmitBtn.prop(
      "disabled",
      len === 0 || len > 200 || !$inquiryTitle.val(),
    );
  });

  $inquirySubmitBtn.on("click", async () => {
    const inquiryReq = {
      ticketId: ticketId,
      inquiryTitle: $inquiryTitle.val(),
      inquiryContent: $inquiryContent.val(),
    };

    try {
      await $.ajax({
        url: `/tickets/api/inquiry/register`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(inquiryReq),
      });

      await alertModal.show({
        title: "완료",
        message: "문의가 등록되었습니다.",
      });
      $inquiryModal.removeClass("is-active");
      $inquiryTitle.val("");
      $inquiryContent.val("");
      await loadInquiries(0);
    } catch {
      toast.error("등록 실패");
    }
  });

  const loadInquiries = async (page: number) => {
    try {
      const data = await $.ajax({
        url: `/tickets/api/inquiry/${ticketId}/list?page=${page}`,
        method: "GET",
      });

      const $list = $("#inquiryList");
      if (!data || !data.content || data.content.length === 0) {
        $list.html(
          '<p style="color:#8a8a8e; text-align:center; padding: 40px 0;">등록된 문의가 없습니다.</p>',
        );
        return;
      }

      const html = data.content
        .map(
          (item: any) => `
        <div class="td-qna__item">
            <div class="td-qna__writer">
              <span>${item.questionerNickname}</span>
              <span class="td-qna__date">${item.questionDate || ""}</span>
            </div>
            <div class="td-qna__title">${item.inquiryTitle}</div>
            <div class="td-qna__content">${item.inquiryContent}</div>
            ${
              item.inquiryResponse
                ? `
            <div class="td-qna__reply">
                <div class="td-qna__writer">호스트 답변 <span class="td-qna__date">${item.inquiryReplyDate || ""}</span></div>
                <div class="td-qna__content">${item.inquiryResponse}</div>
            </div>`
                : ""
            }
        </div>
      `,
        )
        .join("");

      $list.html(html);
      $("#inquiryCountText").text(data.totalElements);
    } catch {
      console.error("문의 목록을 가져오지 못했습니다.");
    }
  };

  void loadInquiries(0);
});
