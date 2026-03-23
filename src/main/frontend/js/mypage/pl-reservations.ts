import $ from "jquery";
import { reservationService } from "@/service/reservation-service";
import { alertModal } from "@/utils/alert";
import { confirmModal } from "@/utils/confirm";
import { Slice } from "@/global/types/slice-type";

/**
 * 예약 데이터 인터페이스입니다.
 */
export interface ReservationDto {
  id: number;
  checkIn: string;
  checkOut: string;
  nickname: string;
  fileName: string;
  uuid: string;
  uploadPath: string;
  defaultImage: boolean;
}

$(() => {
  const placeIdStr = $("#placeId").val() as string;
  const placeId = Number(placeIdStr);

  if (!placeId) {
    console.error("장소 ID 식별 불가.");
    return;
  }

  let currentPage = 0;

  const $reservationList = $("#reservationList");
  const $loadMoreBtn = $("#loadMoreBtn");

  /**
   * 날짜 포맷팅 유틸리티입니다. (YYYY.MM.DD HH:mm 형태)
   * @param {string} dateString 포맷팅할 날짜 문자열
   * @returns {string} 포맷팅된 날짜 문자열
   */
  const formatDateTime = (dateString: string): string => {
    if (!dateString) return "";
    const datePart = dateString.split("T")[0].replace(/-/g, ".");
    const timePart = dateString.split("T")[1]?.substring(0, 5) || "00:00";
    return `${datePart} ${timePart}`;
  };

  /**
   * 특정 페이지의 예약 목록을 서버에서 가져와 렌더링합니다.
   * @param {number} page 조회할 페이지 번호
   */
  const loadReservations = (page: number): void => {
    reservationService
      .getList(placeId, page)
      .done((res: Slice<ReservationDto>) => {
        const reservations = res.content || [];

        if (page === 0 && reservations.length === 0) {
          $reservationList.html(
            '<div class="pl-res__empty">등록된 예약 내역이 없습니다.</div>',
          );
          $loadMoreBtn.hide();
          return;
        }

        renderReservations(reservations);

        if (!res.last) {
          $loadMoreBtn.show();
        } else {
          $loadMoreBtn.hide();
        }
      })
      .fail((xhr, status, error) => {
        console.error("데이터 로드 실패:", error);
        alertModal.show({
          title: "오류",
          message: "예약 목록을 불러오지 못했습니다.",
          type: "error",
        });
      });
  };

  /**
   * 예약 목록 HTML을 생성하여 DOM 리스트에 추가합니다.
   * @param {ReservationDto[]} reservations 예약 데이터 배열
   */
  const renderReservations = (reservations: ReservationDto[]): void => {
    let html = "";

    reservations.forEach((res) => {
      const profileImg = res.defaultImage
        ? `/file/default/display?fileName=${res.fileName}`
        : `/file/display?fileName=${res.uploadPath}/t_${res.uuid}_${res.fileName}`;

      html += `
                <article class="pl-res__card" id="res-${res.id}">
                    <div class="pl-res__card-user">
                        <img src="${profileImg}" alt="프로필 이미지" class="pl-res__card-avatar">
                        <span class="pl-res__card-nickname">${res.nickname}</span>
                    </div>
                    
                    <div class="pl-res__card-date">
                        <span>${formatDateTime(res.checkIn)}</span>
                        <span>~</span>
                        <span>${formatDateTime(res.checkOut)}</span>
                    </div>

                    <div class="pl-res__card-actions">
                        <button type="button" class="pl-res__btn pl-res__btn--approve action-approve" data-id="${res.id}">
                            승인
                        </button>
                        <button type="button" class="pl-res__btn pl-res__btn--reject action-reject" data-id="${res.id}">
                            거절
                        </button>
                    </div>
                </article>
            `;
    });

    $reservationList.append(html);
  };

  /**
   * 리스트가 비어있는지 확인하고, 비어있다면 빈 상태 UI를 렌더링합니다.
   */
  const checkEmptyList = (): void => {
    if ($reservationList.children(".pl-res__card").length === 0) {
      $reservationList.html(
        '<div class="pl-res__empty">등록된 예약 내역이 없습니다.</div>',
      );
    }
  };

  // ==========================================
  // 이벤트 바인딩 영역
  // ==========================================

  $loadMoreBtn.on("click", () => {
    currentPage++;
    loadReservations(currentPage);
  });

  $reservationList.on("click", ".action-approve", async function () {
    const id = $(this).data("id");
    const isConfirm = await confirmModal.show({
      title: "예약 승인",
      message: "이 예약을 승인하시겠습니까?",
    });

    if (isConfirm) {
      reservationService
        .approveReservation(id)
        .done((response: any) => {
          if (response.success) {
            alertModal.show({ title: "성공", message: response.message });
            $(`#res-${id}`).remove();
            checkEmptyList();
          } else {
            alertModal.show({
              title: "실패",
              message: response.message,
              type: "error",
            });
          }
        })
        .fail(() =>
          alertModal.show({
            title: "오류",
            message: "처리 중 오류가 발생했습니다.",
            type: "error",
          }),
        );
    }
  });

  $reservationList.on("click", ".action-reject", async function () {
    const id = $(this).data("id");
    const isConfirm = await confirmModal.show({
      title: "예약 거절",
      message: "이 예약을 거절하시겠습니까?",
    });

    if (isConfirm) {
      reservationService
        .rejectReservation(id)
        .done((response: any) => {
          if (response.success) {
            alertModal.show({ title: "성공", message: response.message });
            $(`#res-${id}`).remove();
            checkEmptyList();
          } else {
            alertModal.show({
              title: "실패",
              message: response.message,
              type: "error",
            });
          }
        })
        .fail(() =>
          alertModal.show({
            title: "오류",
            message: "처리 중 오류가 발생했습니다.",
            type: "error",
          }),
        );
    }
  });

  // 초기 데이터 로드
  loadReservations(currentPage);
});
