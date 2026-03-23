import $ from "jquery";
import { toast } from "@/utils/sonner";
import { confirmModal } from "@/utils/confirm";

$(() => {
  let page = 0;
  let hasNext = true;
  let isLoading = false;
  const $tbody = $("#approvalTableBody");

  const loadApprovalList = async () => {
    if (isLoading || !hasNext) return;
    isLoading = true;
    try {
      const res = await fetch(`/admins/approval/list?page=${page++}`);
      const data = await res.json();
      displayList(data);
      hasNext = !data.slice.last;
    } catch (err) {
      toast.error("목록 로드 실패");
    } finally {
      isLoading = false;
    }
  };

  const displayList = (data: any) => {
    let html = "";
    data.slice.content.forEach((item: any) => {
      html += `
                <tr class="item-row">
                    <td><input type="checkbox" class="item-check" value="${item.id}"></td>
                    <td>${item.name}</td>
                    <td>${item.email}</td>
                    <td>${item.type === "PLACE" ? "대여" : "발매"}</td>
                    <td>${item.createdDate.split("T")[0]}</td>
                    <td>
                        <select class="status-select">
                            <option value="APPROVED" ${item.status === "APPROVED" ? "selected" : ""}>승인완료</option>
                            <option value="REJECTED" ${item.status === "REJECTED" ? "selected" : ""}>승인거절</option>
                        </select>
                    </td>
                    <td><span class="badge ${item.status === "APPROVED" ? "badge--active" : "badge--stop"}">${item.statusName}</span></td>
                </tr>`;
    });
    $tbody.append(html);
  };

  $("#changeApprovalBtn").on("click", async () => {
    const items: any[] = [];
    $(".item-check:checked").each(function () {
      items.push({
        id: $(this).val(),
        status: $(this).closest("tr").find(".status-select").val(),
      });
    });

    if (items.length === 0) return toast.info("대상을 선택하세요.");
    if (
      !(await confirmModal.show({
        title: "상태 변경",
        message: "변경하시겠습니까?",
      }))
    )
      return;

    try {
      await fetch(`/admins/approval/status/change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      });
      toast.success("변경 완료");
      location.reload();
    } catch (e) {
      toast.error("처리 실패");
    }
  });

  void loadApprovalList();
});
