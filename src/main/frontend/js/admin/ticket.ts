import $ from "jquery";
import { toast } from "@/utils/sonner";
import { confirmModal } from "@/utils/confirm";
import { alertModal } from "@/utils/alert";

$(() => {
  let page = 0;
  let hasNext = true;
  let isLoading = false;
  let searchParams = { email: "", ticketTitle: "", status: "" };

  const $tbody = $("#ticketTableBody");

  const loadTicketList = async () => {
    if (isLoading || !hasNext) return;
    isLoading = true;

    const query = new URLSearchParams({
      page: page.toString(),
      email: searchParams.email,
      postTitle: searchParams.ticketTitle,
      status: searchParams.status,
    }).toString();

    try {
      const res = await fetch(`/admins/ticket/list?${query}`);
      if (!res.ok) throw new Error("서버 응답 오류");

      const data = await res.json();
      displayTicketList(data);

      hasNext = !data.slice.last;
      page++;
    } catch (err) {
      toast.error("티켓 목록을 불러오지 못했습니다.");
    } finally {
      isLoading = false;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "badge--active";
      case "REJECTED":
      case "REPLACED":
      case "DELETED":
        return "badge--stop";
      default:
        return "badge--pending";
    }
  };

  const getActionButtons = (status: string) => {
    if (
      status === "REGISTRATION_PENDING" ||
      status === "MODIFICATION_REQUESTED"
    ) {
      return `
                <div style="display:flex; gap:8px; justify-content:center;">
                    <button type="button" class="btn-action btn-action--approve" data-approve="true">승인</button>
                    <button type="button" class="btn-action btn-action--reject" data-approve="false">거절</button>
                </div>
            `;
    }
    return "-";
  };

  const displayTicketList = (data: any) => {
    let html = "";
    data.slice.content.forEach((ticket: any) => {
      const statusName =
        data.enumValues.find((s: any) => s.name === ticket.status)
          ?.displayName || "알 수 없음";
      const badgeClass = getStatusStyle(ticket.status);

      html += `
                <tr data-id="${ticket.postId}" data-status="${ticket.status}">
                    <td>${ticket.postId}</td>
                    <td>${ticket.hostEmail}</td>
                    <td><a href="/ticket/detail/${ticket.postId}" class="ticket-link">${ticket.title}</a></td>
                    <td>${ticket.createdDate.split("T")[0]}</td>
                    <td><span class="badge ${badgeClass}">${statusName}</span></td>
                    <td>${getActionButtons(ticket.status)}</td>
                </tr>
            `;
    });
    $tbody.append(html);
  };

  $(".search-btn").on("click", () => {
    searchParams.email = $("#email").val() as string;
    searchParams.ticketTitle = $("#ticketTitle").val() as string;
    searchParams.status = $("#status").val() as string;

    page = 0;
    hasNext = true;
    $tbody.empty();
    void loadTicketList();
  });

  $(window).on("scroll", () => {
    if (
      $(window).scrollTop()! + $(window).height()! >=
      $(document).height()! - 100
    ) {
      void loadTicketList();
    }
  });

  $tbody.on("click", ".btn-action", async function () {
    const isApprove = $(this).data("approve") as boolean;
    const actionText = isApprove ? "승인" : "거절";

    const $row = $(this).closest("tr");
    const postId = $row.data("id");
    const status = $row.data("status");

    const isConfirm = await confirmModal.show({
      title: `티켓 ${actionText}`,
      message: `해당 티켓의 신청을 ${actionText}하시겠습니까?`,
      type: isApprove ? "point" : "destroy",
    });

    if (!isConfirm) return;

    try {
      const res = await fetch(`/admins/ticket/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApprove, postId, status }),
      });

      if (!res.ok) throw new Error("처리 실패");

      toast.success(`티켓 신청이 ${actionText}되었습니다.`);

      page = 0;
      hasNext = true;
      $tbody.empty();
      void loadTicketList();
    } catch (err) {
      await alertModal.show({
        title: "오류 발생",
        message: "처리 중 문제가 발생했습니다.",
        type: "error",
      });
    }
  });

  void loadTicketList();
});
