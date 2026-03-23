import $ from "jquery";
import { toast } from "@/utils/sonner";
import { confirmModal } from "@/utils/confirm";
import { alertModal } from "@/utils/alert";

$(() => {
  let page = 0;
  let hasNext = true;
  let isLoading = false;
  let searchParams = { email: "", placeTitle: "", status: "" };

  const $tbody = $("#placeTableBody");

  const loadPlaceList = async () => {
    if (isLoading || !hasNext) return;
    isLoading = true;

    const query = new URLSearchParams({
      page: page.toString(),
      email: searchParams.email,
      postTitle: searchParams.placeTitle,
      status: searchParams.status,
    }).toString();

    try {
      const res = await fetch(`/admins/place/list?${query}`);
      if (!res.ok) throw new Error("서버 응답 오류");

      const data = await res.json();
      displayPlaceList(data);

      hasNext = !data.slice.last;
      page++;
    } catch (err) {
      toast.error("장소 목록을 불러오지 못했습니다.");
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

  const displayPlaceList = (data: any) => {
    let html = "";
    data.slice.content.forEach((place: any) => {
      const statusName =
        data.enumValues.find((s: any) => s.name === place.status)
          ?.displayName || "알 수 없음";
      const badgeClass = getStatusStyle(place.status);

      html += `
                <tr data-id="${place.postId}" data-status="${place.status}">
                    <td>${place.postId}</td>
                    <td>${place.hostEmail}</td>
                    <td><a href="/place/${place.postId}" class="place-link">${place.title}</a></td>
                    <td>${place.createdDate.split("T")[0]}</td>
                    <td><span class="badge ${badgeClass}">${statusName}</span></td>
                    <td>${getActionButtons(place.status)}</td>
                </tr>
            `;
    });
    $tbody.append(html);
  };

  $(".search-btn").on("click", () => {
    searchParams.email = $("#email").val() as string;
    searchParams.placeTitle = $("#placeTitle").val() as string;
    searchParams.status = $("#status").val() as string;

    page = 0;
    hasNext = true;
    $tbody.empty();
    void loadPlaceList();
  });

  $(window).on("scroll", () => {
    if (
      $(window).scrollTop()! + $(window).height()! >=
      $(document).height()! - 100
    ) {
      void loadPlaceList();
    }
  });

  $tbody.on("click", ".btn-action", async function () {
    const isApprove = $(this).data("approve") as boolean;
    const actionText = isApprove ? "승인" : "거절";

    const $row = $(this).closest("tr");
    const postId = $row.data("id");
    const status = $row.data("status");

    const isConfirm = await confirmModal.show({
      title: `장소 ${actionText}`,
      message: `해당 장소의 신청을 ${actionText}하시겠습니까?`,
      type: isApprove ? "point" : "destroy",
    });

    if (!isConfirm) return;

    try {
      const res = await fetch(`/admins/place/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApprove, postId, status }),
      });

      if (!res.ok) throw new Error("처리 실패");

      toast.success(`장소 신청이 ${actionText}되었습니다.`);

      // 승인 후 즉각 목록 초기화 및 재검색
      page = 0;
      hasNext = true;
      $tbody.empty();
      void loadPlaceList();
    } catch (err) {
      await alertModal.show({
        title: "오류 발생",
        message: "처리 중 문제가 발생했습니다.",
        type: "error",
      });
    }
  });

  void loadPlaceList();
});
