import $ from "jquery";
import { payService } from "@/service/bootpay";
import { reservationService } from "@/service/reservation-service";
import { confirmModal } from "@/utils/confirm";
import { alertModal } from "@/utils/alert";
import { renderPagination } from "@/utils/pagination";

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
export interface PlaceFileDto {
  uploadPath: string;
  uuid: string;
  fileName: string;
}

/**
 * 예약 상태에 대한 Enum 매핑입니다.
 */
export enum PlaceReservationStatus {
  PENDING = "PENDING",
  WAITING_PAYMENT = "WAITING_PAYMENT",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

/**
 * 장소 예약 리스트 DTO 인터페이스입니다.
 */
export interface PlaceReservationListDto {
  id: number;
  reservationId: number;
  title: string;
  price: number;
  placeAddress: PostAddress;
  placeFileDto: PlaceFileDto;
  evalAvg: number;
  evalCount: number;
  bookmarkCount: number;
  visitors: number;
  checkIn: string;
  checkOut: string;
  content: string;
  reservationStatus: PlaceReservationStatus;
}

$(() => {
  let currentPage = 1;
  let currentSort = "UPCOMING";

  const $contentsContainer = $("#contentsContainer");
  const $paginationContainer = $("#paginationContainer");
  const $loadingMark = $("#loadingMark");

  // ==========================================
  // 유틸리티 함수
  // ==========================================

  /**
   * 숫자에 콤마를 추가하여 포맷팅합니다.
   * @param {number} num 포맷팅할 숫자
   * @returns {string} 콤마가 추가된 문자열
   */
  const formatPrice = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  /**
   * 서버의 LocalDateTime 문자열을 UI에 맞게 포맷팅합니다.
   * @param {string} dateString 서버 날짜 문자열
   * @returns {string} yyyy.MM.dd HH:00 형태의 문자열
   */
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const datePart = dateString.split("T")[0].replace(/-/g, ".");
    const timePart = dateString.split("T")[1]?.substring(0, 5) || "00:00";
    return `${datePart} ${timePart}`;
  };

  /**
   * 상태에 따른 배지 클래스와 텍스트를 반환합니다.
   * @param {PlaceReservationStatus} status 예약 상태
   * @returns {Object} 배지 클래스와 이름
   */
  const getStatusInfo = (status: PlaceReservationStatus) => {
    let className = "res-badge--primary";
    let displayName: string = status as string;

    switch (status) {
      case PlaceReservationStatus.WAITING_PAYMENT:
        className = "res-badge--warning";
        displayName = "결제 대기중";
        break;
      case PlaceReservationStatus.PENDING:
        displayName = "승인 대기중";
        break;
      case PlaceReservationStatus.APPROVED:
        displayName = "승인됨";
        break;
      case PlaceReservationStatus.REJECTED:
        className = "res-badge--danger";
        displayName = "거절됨";
        break;
      case PlaceReservationStatus.CANCELLED:
        className = "res-badge--danger";
        displayName = "취소됨";
        break;
      case PlaceReservationStatus.COMPLETED:
        displayName = "이용 완료";
        break;
    }
    return { className, displayName };
  };

  // ==========================================
  // 데이터 로드 및 렌더링
  // ==========================================

  const loadReservations = async (page: number) => {
    currentPage = page;
    $loadingMark.show();
    $contentsContainer.empty();

    try {
      const res = await reservationService.getReservationsOfUser(
        currentPage,
        currentSort,
      );

      if (!res || !res.data || res.data.empty) {
        $contentsContainer.html(`
          <div class="res-empty">
              <i class="fa-regular fa-folder-open"></i>
              <p>예약 내역이 없습니다.</p>
          </div>
        `);
        $paginationContainer.empty();
        return;
      }

      const reservations: PlaceReservationListDto[] = res.data.content;
      renderList(reservations);

      renderPagination(
        $paginationContainer,
        res.pagination,
        (selectedPage: number) => {
          void loadReservations(selectedPage);
        },
      );
    } catch (error) {
      console.error(error);
      $contentsContainer.html(
        '<div class="res-empty"><p>데이터를 불러오는 데 실패했습니다.</p></div>',
      );
    } finally {
      $loadingMark.hide();
    }
  };

  const renderList = (reservations: PlaceReservationListDto[]) => {
    const html = reservations
      .map((res) => {
        const imagePath = `/file/display?fileName=${res.placeFileDto.uploadPath}/t_${res.placeFileDto.uuid}_${res.placeFileDto.fileName}`;
        const statusInfo = getStatusInfo(res.reservationStatus);
        const isPendingOrWaiting =
          res.reservationStatus === PlaceReservationStatus.PENDING ||
          res.reservationStatus === PlaceReservationStatus.WAITING_PAYMENT;
        const isWaitingPayment =
          res.reservationStatus === PlaceReservationStatus.WAITING_PAYMENT;

        const checkInFormatted = formatDate(res.checkIn);
        const checkOutFormatted = formatDate(res.checkOut);
        const priceFormatted = formatPrice(res.price);

        return `
        <article class="res-card">
            <a class="res-card__img-link" href="/place/${res.id}">
                <img class="res-card__img" alt="${res.title}" src="${imagePath}">
            </a>
            <div class="res-card__body">
                <div class="res-card__top">
                    <span class="res-badge ${statusInfo.className}">${statusInfo.displayName}</span>
                </div>
                <h3 class="res-card__title">
                    <a href="/place/${res.id}">${res.title}</a>
                </h3>
                <p class="res-card__address">${res.placeAddress.address}</p>
                <div class="res-card__info">
                    <div class="res-card__info-item">
                        <i class="fa-regular fa-calendar"></i>
                        <span>${checkInFormatted}</span>
                        <span>~</span>
                        <span>${checkOutFormatted}</span>
                    </div>
                    <div class="res-card__info-item">
                        <i class="fa-solid fa-user-group"></i>
                        <span>총 ${res.visitors}명</span>
                    </div>
                </div>
                <div class="res-card__bottom">
                    <div class="res-card__price">
                        <strong>${priceFormatted}원</strong>
                    </div>
                    <div class="res-card__actions">
                        <button class="res-btn res-btn--outline action-detail"
                                data-title="${res.title}"
                                data-address="${res.placeAddress.address}"
                                data-checkin="${checkInFormatted}"
                                data-checkout="${checkOutFormatted}"
                                data-visitors="${res.visitors}"
                                data-price="${priceFormatted}원">
                            상세보기
                        </button>

                        ${
                          isPendingOrWaiting
                            ? `<button class="res-btn res-btn--danger action-cancel" data-id="${res.reservationId}">예약 취소</button>`
                            : `<button class="res-btn res-btn--danger action-delete" data-id="${res.reservationId}">기록 삭제</button>`
                        }

                        ${
                          isWaitingPayment
                            ? `<button class="res-btn res-btn--primary action-pay" data-id="${res.reservationId}">결제하기</button>`
                            : ""
                        }
                    </div>
                </div>
            </div>
        </article>
      `;
      })
      .join("");

    $contentsContainer.html(html);
  };

  // ==========================================
  // 이벤트 제어 (정렬 및 동적 요소 위임)
  // ==========================================

  const $sortBtn = $("#sortBtn");
  const $sortList = $("#sortList");
  const $sortIcon = $sortBtn.find("i");
  const $currentSortText = $("#currentSortText");

  $sortBtn.on("click", (e) => {
    e.stopPropagation();
    $sortList.toggleClass("show");
    $sortIcon.css(
      "transform",
      $sortList.hasClass("show") ? "rotate(180deg)" : "rotate(0deg)",
    );
  });

  $sortList.find("button").on("click", function () {
    const $this = $(this);
    currentSort = $this.data("sort") as string;
    const sortName = $this.data("name") as string;

    $sortList.find("button").removeClass("selected");
    $this.addClass("selected");
    $currentSortText.text(sortName);

    void loadReservations(1);
  });

  $(document).on("click", () => {
    $sortList.removeClass("show");
    $sortIcon.css("transform", "rotate(0deg)");
  });

  $contentsContainer.on("click", ".action-detail", function () {
    const $btn = $(this);
    const title = $btn.data("title");
    const address = $btn.data("address");
    const checkin = $btn.data("checkin");
    const checkout = $btn.data("checkout");
    const visitors = $btn.data("visitors");
    const price = $btn.data("price");

    const html = `
            <div class="res-detail-row"><span>장소명</span><span>${title}</span></div>
            <div class="res-detail-row"><span>위치</span><span>${address}</span></div>
            <div class="res-detail-row"><span>일정</span><span>${checkin} ~ ${checkout}</span></div>
            <div class="res-detail-row"><span>인원</span><span>${visitors}명</span></div>
            <div class="res-detail-row" style="border-bottom: none;">
                <span>결제금액</span><span class="highlight">${price}</span>
            </div>
        `;

    $("#resModalContent").html(html);
    $("#resDetailModal").addClass("is-active");
  });

  $("#resModalClose").on("click", () => {
    $("#resDetailModal").removeClass("is-active");
  });

  $contentsContainer.on("click", ".action-cancel", async function () {
    const reservationId = $(this).data("id");
    const isConfirm = await confirmModal.show({
      title: "예약 취소",
      message: "예약을 취소하시겠습니까?",
    });

    if (isConfirm) {
      const { success, message } =
        await reservationService.cancelReservation(reservationId);
      if (success) {
        await alertModal.show({ title: "성공", message });
        void loadReservations(currentPage);
      } else {
        await alertModal.show({ title: "실패", message, type: "error" });
      }
    }
  });

  $contentsContainer.on("click", ".action-delete", async function () {
    const reservationId = $(this).data("id");
    const isConfirm = await confirmModal.show({
      title: "기록 삭제",
      message: "예약 내역을 삭제하시겠습니까?",
    });

    if (isConfirm) {
      const { success, message } =
        await reservationService.deleteReservation(reservationId);
      if (success) {
        await alertModal.show({ title: "성공", message });
        void loadReservations(currentPage);
      } else {
        await alertModal.show({ title: "실패", message, type: "error" });
      }
    }
  });

  $contentsContainer.on("click", ".action-pay", function () {
    const reservationId = $(this).data("id");
    payService.requestPlacePaymentSave(reservationId, payService.payItem);
  });

  // 초기 로드
  void loadReservations(1);
});
