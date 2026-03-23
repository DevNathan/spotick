import $ from "jquery";
import flatpickr from "flatpickr";
import { Korean } from "flatpickr/dist/l10n/ko.js";
import { toast } from "@/utils/sonner";
import { renderPagination } from "@/utils/pagination";
import { PaginationData } from "@/global/types/page-type";

/**
 * 호스트 티켓 관리 페이지 (리스트 조회 및 판매 현황) 모듈입니다.
 */
$(() => {
  let gradeData: any[] = [];
  const $detailContainer = $("#detailContainer");
  const $paginationContainer = $("#paginationContainer");

  // ==========================================
  // 1. 전역 페이지네이션 렌더링
  // ==========================================
  if ($paginationContainer.length > 0) {
    const pageData: PaginationData = {
      hasPrevBlock: $paginationContainer.data("has-prev") === true,
      hasNextBlock: $paginationContainer.data("has-next") === true,
      startPage: parseInt($paginationContainer.data("start-page"), 10),
      endPage: parseInt($paginationContainer.data("end-page"), 10),
      lastPage: parseInt($paginationContainer.data("last-page"), 10),
      currentPage: parseInt($paginationContainer.data("current-page"), 10),
      blockSize: parseInt($paginationContainer.data("block-size") || "5", 10),
    };
    const viewType = $paginationContainer.data("view-type") as string;

    renderPagination($paginationContainer, pageData, (selectedPage: number) => {
      location.href = `/mypage/tickets?page=${selectedPage}&view=${viewType}`;
    });
  }

  // ==========================================
  // 2. 티켓 리스트 카드 클릭 이벤트
  // ==========================================
  $(".tm-card").on("click", function (e) {
    if ($(e.target).closest(".action-ignore").length > 0) {
      return;
    }

    $(".tm-card").removeClass("tm-card--active");
    $(this).addClass("tm-card--active");

    const dto = {
      ticketId: $(this).data("id"),
      title: $(this).data("title"),
      ticketAddress: {
        address: $(this).data("address"),
        addressDetail: $(this).data("address-detail"),
      },
      startDate: $(this).data("start-date"),
      endDate: $(this).data("end-date"),
    };

    renderDetailLayout(dto);
  });

  // ==========================================
  // 3. 우측 플로팅 영역 상세 및 캘린더 렌더링
  // ==========================================
  const renderDetailLayout = (dto: any) => {
    const html = `
            <div class="tm-status">
                <h3 class="tm-status__title">${dto.title}</h3>
                <p class="tm-status__address"><i class="fa-solid fa-location-dot"></i> ${dto.ticketAddress.address} ${dto.ticketAddress.addressDetail}</p>
                
                <div class="tm-status__section">
                    <h4 class="tm-status__subtitle">날짜 선택</h4>
                    <div class="tm-status__calendar" id="salesDatePicker"></div>
                </div>

                <div class="tm-status__section">
                    <h4 class="tm-status__subtitle">티켓 판매 현황</h4>
                    <table class="tm-status__table">
                        <thead>
                            <tr>
                                <th>등급</th>
                                <th>가격</th>
                                <th>판매수</th>
                                <th>총 좌석</th>
                            </tr>
                        </thead>
                        <tbody id="detailGrades">
                            <tr><td colspan="4" class="tm-empty-td">데이터를 불러오는 중입니다...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

    $detailContainer.html(html);

    flatpickr("#salesDatePicker", {
      locale: Korean,
      inline: true,
      minDate: dto.startDate,
      maxDate: dto.endDate,
      defaultDate: dto.startDate,
      dateFormat: "Y-m-d",
      onChange: function (_, dateStr) {
        loadGrades(dto.ticketId, dateStr);
      },
    });

    loadGrades(dto.ticketId, dto.startDate);
  };

  // ==========================================
  // 4. 날짜별 판매 등급(Grade) 데이터 로드
  // ==========================================
  const loadGrades = async (ticketId: number, dateStr: string) => {
    const $detailGrades = $("#detailGrades");
    $detailGrades.html(
      '<tr><td colspan="4" class="tm-empty-td"><img src="/imgs/loading.svg" alt="로딩 중" style="width:24px;"></td></tr>',
    );

    try {
      const existing = gradeData.find(
        (d) => d.ticketId === ticketId && d.date === dateStr,
      );
      let data = [];

      if (existing) {
        data = existing.grade;
      } else {
        const res = await $.ajax({
          url: `/ticket/api/getGrades?ticketId=${ticketId}&date=${dateStr}`,
          method: "GET",
        });
        data = res.data || [];
        gradeData.push({ ticketId, date: dateStr, grade: data });
      }

      if (data.length === 0) {
        $detailGrades.html(
          '<tr><td colspan="4" class="tm-empty-td">해당 날짜에 판매 정보가 없습니다.</td></tr>',
        );
        return;
      }

      const rows = data
        .map(
          (g: any) => `
                <tr>
                    <td>${g.gradeName}</td>
                    <td>${new Intl.NumberFormat("ko-KR").format(g.price)}</td>
                    <td class="tm-text-blue">${g.sold}</td>
                    <td>${g.maxPeople}</td>
                </tr>
            `,
        )
        .join("");

      $detailGrades.html(rows);
    } catch (e) {
      toast.error("판매 현황을 불러오지 못했습니다.");
      $detailGrades.html(
        '<tr><td colspan="4" class="tm-empty-td">데이터 로딩 실패</td></tr>',
      );
    }
  };
});
