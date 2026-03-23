import $ from "jquery";
import flatpickr from "flatpickr";
import { Korean } from "flatpickr/dist/l10n/ko.js";
import { toast } from "@/utils/sonner";
import { alertModal } from "@/utils/alert";
import { confirmModal } from "@/utils/confirm";

declare const kakao: any;

$(() => {
  const isLoggedIn = $("#isLoggedIn").val() === "true";
  const placeId = $("#placeId").val() as string;
  const price = parseInt($("#placePrice").val() as string, 10);
  const surcharge = parseInt($("#placeSurcharge").val() as string, 10);
  const defaultPeople = parseInt($("#placeDefaultPeople").val() as string, 10);

  const $navItems = $(".pd-nav__item");
  const $sections = $(".pd-section");
  const $scheduleBtn = $("#scheduleBtn");
  const $schedulePopup = $("#schedulePopup");
  const $peopleBtn = $("#peopleBtn");
  const $peoplePopup = $("#peoplePopup");
  const $peopleCount = $("#peopleCount");
  const $calcResultBox = $("#calcResultBox");
  const $submitBtn = $("#submitBtn");
  const $formCheckIn = $("#formCheckIn");
  const $formCheckOut = $("#formCheckOut");
  const $formVisitors = $("#formVisitors");

  const $inquiryModal = $("#inquiryModal");
  const $inquiryTitle = $("#inquiryTitle");
  const $inquiryContent = $("#inquiryContent");
  const $inquiryLength = $("#inquiryLength");
  const $inquirySubmitBtn = $("#inquirySubmitBtn");
  const $inquiryList = $("#inquiryList");

  // ==========================================
  // 1. 카카오맵 초기화
  // ==========================================
  const initMap = () => {
    kakao.maps.load(() => {
      const lat = parseFloat($("#placeLat").val() as string);
      const lng = parseFloat($("#placeLng").val() as string);
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
    window.scrollTo({ top: offset - 120, behavior: "smooth" });
  });

  $(window).on("scroll", function () {
    const scrollTop = $(this).scrollTop()! + 130;
    $sections.each(function () {
      if (scrollTop >= $(this).offset()!.top) {
        const id = $(this).attr("id");
        $navItems.removeClass("active");
        $(`.pd-nav__item[data-target="${id}"]`).addClass("active");
      }
    });
  });

  // ==========================================
  // 3. 북마크 통신
  // ==========================================
  $("#bookmarkBtn").on("click", async function () {
    if (!isLoggedIn) {
      const go = await confirmModal.show({
        title: "알림",
        message: "로그인 하시겠습니까?",
      });
      if (go) location.href = "/user/login";
      return;
    }
    const $btn = $(this);
    const isChecked = $btn.attr("data-checked") === "true";
    const $icon = $btn.find("i");

    try {
      const res = await $.ajax({
        url: `/bookmark?placeId=${placeId}&status=${isChecked}`,
        method: "GET",
      });
      $btn.attr("data-checked", res.toString());
      if (res) {
        $icon.removeClass("fa-regular").addClass("fa-solid pd-bookmark--on");
        toast.success("북마크 되었습니다.");
      } else {
        $icon.removeClass("fa-solid pd-bookmark--on").addClass("fa-regular");
        toast.success("북마크 취소되었습니다.");
      }
    } catch {
      toast.error("오류가 발생했습니다.");
    }
  });

  // ==========================================
  // 4. Flatpickr & 타임 블록 예약 통제 엔진
  // ==========================================
  let disabledData: any[] = [];
  let selectedDateStr = "";
  let pickStart: number | null = null;
  let pickEnd: number | null = null;

  const fp = flatpickr("#datePicker", {
    locale: Korean,
    minDate: "today",
    dateFormat: "Y-m-d",
    inline: true,
    appendTo: document.getElementById("flatpickrWrapper") as HTMLElement,
    onChange: async (_, dateStr) => {
      try {
        disabledData = await $.ajax({
          url: `/reservations/v1/places/${placeId}/reserved-times?reservationDate=${dateStr}`,
          method: "GET",
        });
        renderTimeGrid(dateStr);
      } catch {
        toast.error("예약 정보를 불러오지 못했습니다.");
      }
    },
  }) as flatpickr.Instance;

  // [상남자의 타임 블록 렌더링 로직 (4시간 제한 추가)]
  const renderTimeGrid = (dateStr: string) => {
    selectedDateStr = dateStr;
    pickStart = null;
    pickEnd = null;
    updateTimeGridUI();

    const $grid = $("#timeGrid").empty();

    const nowMs = Date.now();
    const bufferMs = 4 * 60 * 60 * 1000; // 4시간
    const cutoffMs = nowMs + bufferMs;

    for (let i = 0; i < 24; i++) {
      const slotStartMs = new Date(
        `${dateStr.replace(/-/g, "/")} ${i.toString().padStart(2, "0")}:00:00`,
      ).getTime();
      const slotEndMs = slotStartMs + 3600000;

      // 과거 시간 및 현재시간 기준 4시간 이내 접근 완전 차단
      const isPastOrTooClose = slotStartMs < cutoffMs;

      // 이미 예약된 시간 차단
      const isBooked = disabledData.some((d) => {
        const bStart = new Date(d.checkIn.replace(/-/g, "/")).getTime();
        const bEnd = new Date(d.checkOut.replace(/-/g, "/")).getTime();
        return slotStartMs < bEnd && slotEndMs > bStart;
      });

      const isDisabled = isBooked || isPastOrTooClose;

      const $btn = $(
        `<button type="button" class="pd-time-slot ${isDisabled ? "disabled" : ""}" data-hour="${i}">${i}</button>`,
      );
      $grid.append($btn);
    }
  };

  $("#timeGrid").on("click", ".pd-time-slot:not(.disabled)", function () {
    const hour = parseInt($(this).data("hour"), 10);

    if (pickStart === null || pickEnd !== null) {
      pickStart = hour;
      pickEnd = null;
    } else {
      if (hour < pickStart) {
        pickStart = hour;
      } else {
        let hasDisabled = false;
        for (let i = pickStart; i <= hour; i++) {
          if ($(`.pd-time-slot[data-hour="${i}"]`).hasClass("disabled")) {
            hasDisabled = true;
            break;
          }
        }
        if (hasDisabled) {
          toast.error("선택 구간에 이용할 수 없는 시간이 포함되어 있습니다.");
          pickStart = hour;
        } else {
          pickEnd = hour;
        }
      }
    }
    updateTimeGridUI();
    validateForm();
  });

  const formatDateTime = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    const h = date.getHours().toString().padStart(2, "0");
    return `${y}-${m}-${d} ${h}:00:00`;
  };

  const updateTimeGridUI = () => {
    $(".pd-time-slot").removeClass("selected in-range");
    const $timeText = $("#scheduleTimeText");

    if (pickStart === null) {
      $timeText.text("시간을 선택해주세요 (시작 ~ 종료)");
      $formCheckIn.val("");
      $formCheckOut.val("");
      return;
    }

    if (pickEnd === null) {
      $(`.pd-time-slot[data-hour="${pickStart}"]`).addClass("selected");
      const inDate = new Date(
        `${selectedDateStr.replace(/-/g, "/")} ${pickStart.toString().padStart(2, "0")}:00:00`,
      );
      const outDate = new Date(inDate.getTime() + 3600000);

      $formCheckIn.val(formatDateTime(inDate));
      $formCheckOut.val(formatDateTime(outDate));
      $timeText.text(`${pickStart}:00 ~ ${outDate.getHours()}:00 (1시간)`);
    } else {
      for (let i = pickStart; i <= pickEnd; i++) {
        $(`.pd-time-slot[data-hour="${i}"]`).addClass("in-range");
      }
      $(`.pd-time-slot[data-hour="${pickStart}"]`).addClass("selected");
      $(`.pd-time-slot[data-hour="${pickEnd}"]`).addClass("selected");

      const inDate = new Date(
        `${selectedDateStr.replace(/-/g, "/")} ${pickStart.toString().padStart(2, "0")}:00:00`,
      );
      const outDate = new Date(
        `${selectedDateStr.replace(/-/g, "/")} ${pickEnd.toString().padStart(2, "0")}:00:00`,
      );
      outDate.setHours(outDate.getHours() + 1);

      $formCheckIn.val(formatDateTime(inDate));
      $formCheckOut.val(formatDateTime(outDate));
      $timeText.text(
        `${pickStart}:00 ~ ${outDate.getHours()}:00 (${pickEnd - pickStart + 1}시간)`,
      );
    }
  };

  $scheduleBtn.on("click", (e) => {
    e.stopPropagation();
    $peoplePopup.removeClass("is-active");
    $schedulePopup.toggleClass("is-active");
    if ($schedulePopup.hasClass("is-active")) {
      setTimeout(() => fp.redraw(), 10);
    }
  });

  $("#scheduleConfirmBtn").on("click", () => {
    if (!$formCheckIn.val() || !$formCheckOut.val()) {
      toast.error("시간을 선택해주세요.");
      return;
    }
    const inDate = new Date(($formCheckIn.val() as string).replace(/-/g, "/"));
    const outDate = new Date(
      ($formCheckOut.val() as string).replace(/-/g, "/"),
    );
    const diff = (outDate.getTime() - inDate.getTime()) / 3600000;

    const ampmIn = inDate.getHours() >= 12 ? "오후" : "오전";
    const ampmOut = outDate.getHours() >= 12 ? "오후" : "오전";

    $scheduleBtn.text(
      `${inDate.getMonth() + 1}월 ${inDate.getDate()}일 ${ampmIn} ${inDate.getHours() % 12 || 12}시 ~ ${ampmOut} ${outDate.getHours() % 12 || 12}시 (${diff}시간)`,
    );
    $schedulePopup.removeClass("is-active");
    calcTotal();
  });

  $peopleBtn.on("click", (e) => {
    e.stopPropagation();
    $schedulePopup.removeClass("is-active");
    $peoplePopup.toggleClass("is-active");
  });

  $("#peopleMinus").on("click", () => {
    let v = parseInt($peopleCount.val() as string);
    if (v > 1) $peopleCount.val(v - 1);
  });

  $("#peoplePlus").on("click", () => {
    let v = parseInt($peopleCount.val() as string);
    if (v < 99) $peopleCount.val(v + 1);
  });

  $("#peopleConfirmBtn").on("click", () => {
    const v = $peopleCount.val();
    $peopleBtn.text(`총 ${v}명`);
    $formVisitors.val(v as string);
    $peoplePopup.removeClass("is-active");
    validateForm();
    calcTotal();
  });

  $(document).on("click", (e) => {
    if (!$(e.target).closest(".pd-reserve__group").length) {
      $(".pd-popup").removeClass("is-active");
    }
  });

  const validateForm = () => {
    const ok = $formCheckIn.val() && $formCheckOut.val() && $formVisitors.val();
    $submitBtn.prop("disabled", !ok);
  };

  const calcTotal = () => {
    if (!$formCheckIn.val() || !$formVisitors.val()) return;
    const h =
      (new Date(($formCheckOut.val() as string).replace(/-/g, "/")).getTime() -
        new Date(($formCheckIn.val() as string).replace(/-/g, "/")).getTime()) /
      3600000;
    const p = parseInt($formVisitors.val() as string);

    const base = price * h;
    const exP = p > defaultPeople ? p - defaultPeople : 0;
    const exFee = exP * surcharge;

    $calcResultBox.html(`
      <div class="pd-calc-row"><span>장소 대여료 (${h}시간)</span><span>${base.toLocaleString()}원</span></div>
      ${exFee > 0 ? `<div class="pd-calc-row"><span>인원 추가 (${exP}명)</span><span>${exFee.toLocaleString()}원</span></div>` : ""}
      <div class="pd-calc-total"><span>총 결제 금액</span><span>${(base + exFee).toLocaleString()}원</span></div>
    `);
  };

  // ==========================================
  // 예약 제출
  // ==========================================
  $submitBtn.on("click", async () => {
    if (!isLoggedIn) {
      if (
        await confirmModal.show({
          title: "알림",
          message: "로그인 하시겠습니까?",
        })
      )
        location.href = "/user/login";
      return;
    }

    const requestData = {
      placeId: placeId,
      reservationCheckIn: $formCheckIn.val(),
      reservationCheckOut: $formCheckOut.val(),
      reservationVisitors: $formVisitors.val(),
    };

    try {
      const isOverlap = await $.ajax({
        url: "/reservations/v1/availability/check",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(requestData),
      });

      if (isOverlap) {
        await alertModal.show({
          title: "예약 불가",
          message: "선택하신 시간에 이미 예약이 존재합니다.",
          type: "error",
        });
        return;
      }

      await $.ajax({
        url: "/reservations/v1/register",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(requestData),
      });

      await alertModal.show({
        title: "예약 완료",
        message: "장소 예약 요청이 성공적으로 완료되었습니다.",
      });
    } catch (err) {
      console.error(err);
      toast.error("예약 처리 중 오류가 발생했습니다.");
    }
  });

  // ==========================================
  // 5. 문의 및 모달
  // ==========================================
  $("#inquiryOpenBtn").on("click", async () => {
    if (!isLoggedIn) {
      if (
        await confirmModal.show({
          title: "알림",
          message: "로그인 하시겠습니까?",
        })
      )
        location.href = "/user/login";
      return;
    }
    $inquiryModal.addClass("is-active");
  });

  $("#inquiryCloseBtn").on("click", () =>
    $inquiryModal.removeClass("is-active"),
  );

  $inquiryContent.add($inquiryTitle).on("input", () => {
    const len = $inquiryContent.val()?.toString().length || 0;
    $inquiryLength.text(len).toggleClass("over", len > 200);
    $inquirySubmitBtn.prop(
      "disabled",
      len === 0 || len > 200 || !$inquiryTitle.val(),
    );
  });

  $inquirySubmitBtn.on("click", async () => {
    try {
      await $.ajax({
        url: "/places/inquiry/v1/register",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
          placeId,
          inquiryTitle: $inquiryTitle.val(),
          inquiryContent: $inquiryContent.val(),
        }),
      });
      await alertModal.show({
        title: "완료",
        message: "문의가 등록되었습니다.",
      });
      $inquiryModal.removeClass("is-active");
      $inquiryTitle.val("");
      $inquiryContent.val("");
      await loadInq(1);
    } catch {
      toast.error("등록 실패");
    }
  });

  const loadInq = async (page: number) => {
    try {
      const data = await $.ajax({
        url: `/places/inquiry/v1/${placeId}/list?page=${page}`,
      });
      if (data.inquiryPage.empty) {
        $inquiryList.html(
          '<p style="color:#8a8a8e; text-align:center; padding: 40px 0;">문의가 없습니다.</p>',
        );
        return;
      }
      const html = data.inquiryPage.content
        .map(
          (item: any) => `
        <div class="pd-list-item">
            <div class="pd-list-item__writer">${item.questionerNickname} <span class="pd-list-item__date">${item.questionDate}</span></div>
            <div style="font-weight:700;">${item.inquiryTitle}</div>
            <div class="pd-list-item__content">${item.inquiryContent}</div>
            ${
              item.inquiryResponse
                ? `
            <div class="pd-list-item__reply">
                <div class="pd-list-item__writer">호스트 답변 <span class="pd-list-item__date">${item.inquiryReplyDate}</span></div>
                <div class="pd-list-item__content">${item.inquiryResponse}</div>
            </div>`
                : ""
            }
        </div>
      `,
        )
        .join("");
      $inquiryList.html(html);
      $("#titleInquiryCount, #navInquiryCount").text(
        data.inquiryPage.totalElements,
      );
    } catch {}
  };
  void loadInq(1);
});
