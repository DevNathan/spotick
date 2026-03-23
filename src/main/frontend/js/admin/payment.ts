import $ from "jquery";
import { toast } from "@/utils/sonner";
import { confirmModal } from "@/utils/confirm";
import { alertModal } from "@/utils/alert";

$(() => {
  let page = 0;
  let hasNext = true;
  let isLoading = false;
  let searchParams = { email: "", method: "" };

  const $tbody = $("#paymentTableBody");

  const loadPaymentList = async () => {
    if (isLoading || !hasNext) return;
    isLoading = true;

    const query = new URLSearchParams({
      page: page.toString(),
      email: searchParams.email,
      method: searchParams.method,
    }).toString();

    try {
      const res = await fetch(`/admins/payment/list?${query}`);
      if (!res.ok) throw new Error("서버 응답 오류");

      const data = await res.json();
      displayPaymentList(data);

      hasNext = !data.slice.last;
      page++;
    } catch (err) {
      toast.error("결제 내역을 불러오지 못했습니다.");
    } finally {
      isLoading = false;
    }
  };

  const displayPaymentList = (data: any) => {
    let html = "";
    data.slice.content.forEach((pay: any) => {
      const isCanceled = pay.status === "CANCELED";
      const badgeClass = isCanceled ? "badge--cancel" : "badge--success";
      const statusText = isCanceled ? "결제취소" : "결제완료";

      html += `
                <tr data-id="${pay.paymentId}">
                    <td>${pay.paymentId}</td>
                    <td>${pay.orderNumber}</td>
                    <td>${pay.userEmail}</td>
                    <td>${pay.amount.toLocaleString()}원</td>
                    <td>${pay.methodDisplayName}</td>
                    <td>${pay.paymentDate.split("T")[0]}</td>
                    <td><span class="badge ${badgeClass}">${statusText}</span></td>
                    <td>
                        ${!isCanceled ? `<button type="button" class="btn-cancel" data-id="${pay.paymentId}">취소처리</button>` : "-"}
                    </td>
                </tr>
            `;
    });
    $tbody.append(html);
  };

  $(".search-btn").on("click", () => {
    searchParams.email = $("#email").val() as string;
    searchParams.method = $("#paymentMethod").val() as string;

    page = 0;
    hasNext = true;
    $tbody.empty();
    void loadPaymentList();
  });

  $(window).on("scroll", () => {
    if (
      $(window).scrollTop()! + $(window).height()! >=
      $(document).height()! - 100
    ) {
      void loadPaymentList();
    }
  });

  $tbody.on("click", ".btn-cancel", async function () {
    const paymentId = $(this).data("id");

    const isConfirm = await confirmModal.show({
      title: "결제 취소",
      message:
        "해당 결제 건을 정말 취소하시겠습니까?<br>취소 시 즉시 환불 절차가 진행됩니다.",
      type: "destroy",
    });

    if (!isConfirm) return;

    try {
      const res = await fetch(`/admins/payment/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });

      if (!res.ok) throw new Error("처리 실패");

      toast.success("결제가 정상적으로 취소되었습니다.");

      page = 0;
      hasNext = true;
      $tbody.empty();
      void loadPaymentList();
    } catch (err) {
      await alertModal.show({
        title: "오류 발생",
        message: "결제 취소 중 문제가 발생했습니다.",
        type: "error",
      });
    }
  });

  void loadPaymentList();
});
