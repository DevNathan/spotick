import $ from "jquery";
import { toast } from "@/utils/sonner";
import { confirmModal } from "@/utils/confirm";
import { alertModal } from "@/utils/alert";

$(() => {
  let page = 0;
  let hasNext = true;
  let isLoading = false;
  let searchParams = { email: "", nickName: "", status: "" };

  const $tbody = $("#userTableBody");
  const $checkAll = $("#checkAll");

  /**
   * 유저 목록을 서버로부터 조회하여 화면에 렌더링합니다.
   */
  const loadUserList = async () => {
    if (isLoading || !hasNext) return;
    isLoading = true;

    const query = new URLSearchParams({
      page: page.toString(),
      email: searchParams.email,
      nickName: searchParams.nickName,
      status: searchParams.status,
    }).toString();

    try {
      const res = await fetch(`/admins/user/list?${query}`);
      if (!res.ok) throw new Error("서버 응답 오류");

      const data = await res.json();
      displayUserList(data);

      hasNext = !data.slice.last;
      page++;
    } catch (err) {
      toast.error("회원 목록을 불러오지 못했습니다.");
    } finally {
      isLoading = false;
    }
  };

  /**
   * 전달받은 유저 데이터를 테이블의 행(tr) 요소로 변환하여 추가합니다.
   * @param data 서버로부터 응답받은 페이징 및 유저 데이터 객체
   */
  const displayUserList = (data: any) => {
    let html = "";
    data.slice.content.forEach((user: any) => {
      const isCommonUser = user.authorityType === "ROLE_USER";
      const statusBadgeClass =
        user.userStatus === "ACTIVATE" ? "badge--active" : "badge--stop";

      let statusOptions = data.enumValues
        .map(
          (status: any) =>
            `<option value="${status.name}" ${user.userStatus === status.name ? "selected" : ""}>${status.displayName}</option>`,
        )
        .join("");

      let currentStatusName =
        data.enumValues.find((s: any) => s.name === user.userStatus)
          ?.displayName || "상태없음";

      html += `
                <tr>
                    <td><input type="checkbox" class="user-check" value="${user.id}"></td>
                    <td>${user.email}</td>
                    <td>${user.nickName}</td>
                    <td>${isCommonUser ? "일반회원" : "관리자"}</td>
                    <td>${user.tel || "미입력"}</td>
                    <td>${user.createdDate.split("T")[0]}</td>
                    <td>
                        <select class="status-select" data-user-id="${user.id}">
                            ${statusOptions}
                        </select>
                    </td>
                    <td><span class="badge ${statusBadgeClass}">${currentStatusName}</span></td>
                    <td>
                        <button type="button" class="btn-authority ${isCommonUser ? "" : "btn-authority--admin"}" 
                                data-id="${user.id}" data-isgranted="${isCommonUser}">
                            ${isCommonUser ? "권한부여" : "권한해제"}
                        </button>
                    </td>
                </tr>
            `;
    });
    $tbody.append(html);
  };

  $(".search-btn").on("click", () => {
    searchParams.email = $("#email").val() as string;
    searchParams.nickName = $("#nickName").val() as string;
    searchParams.status = $("#status").val() as string;

    page = 0;
    hasNext = true;
    $tbody.empty();
    $checkAll.prop("checked", false);
    void loadUserList();
  });

  $(window).on("scroll", () => {
    if (
      $(window).scrollTop()! + $(window).height()! >=
      $(document).height()! - 100
    ) {
      void loadUserList();
    }
  });

  $checkAll.on("change", function () {
    $(".user-check").prop("checked", $(this).is(":checked"));
  });

  $tbody.on("change", ".user-check", function () {
    const allChecked =
      $(".user-check").length === $(".user-check:checked").length;
    $checkAll.prop("checked", allChecked);
  });

  $tbody.on("click", ".btn-authority", async function () {
    const userId = $(this).data("id");
    const isGranted = $(this).data("isgranted");

    const isConfirm = await confirmModal.show({
      title: "권한 변경",
      message: `${userId}번 회원의 관리자 권한을 ${isGranted ? "부여" : "해제"}하시겠습니까?`,
      type: isGranted ? "point" : "destroy",
    });

    if (!isConfirm) return;

    try {
      const res = await fetch(`/admins/user/authority/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isGranted }),
      });

      if (!res.ok) throw new Error("네트워크 응답 오류");

      toast.success("관리자 권한이 성공적으로 변경되었습니다.");

      page = 0;
      hasNext = true;
      $tbody.empty();
      void loadUserList();
    } catch (err) {
      await alertModal.show({
        title: "오류 발생",
        message: "권한 변경 중 문제가 발생했습니다. 다시 시도해 주세요.",
        type: "error",
      });
    }
  });

  $("#changeStatusBtn").on("click", async () => {
    const statusObjArr: { userId: string; status: string }[] = [];

    $(".user-check:checked").each(function () {
      const userId = $(this).val() as string;
      const status = $(this)
        .closest("tr")
        .find(".status-select")
        .val() as string;
      statusObjArr.push({ userId, status });
    });

    if (statusObjArr.length === 0) {
      toast.info("상태를 변경할 회원을 먼저 선택해 주세요.");
      return;
    }

    const isConfirm = await confirmModal.show({
      title: "상태 변경",
      message: `선택한 ${statusObjArr.length}명 회원의 상태를 변경하시겠습니까?`,
    });

    if (!isConfirm) return;

    try {
      const res = await fetch(`/admins/user/status/change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusObjArr),
      });

      if (!res.ok) throw new Error("상태 변경 실패");

      toast.success("선택한 회원의 상태가 일괄 변경되었습니다.");

      page = 0;
      hasNext = true;
      $tbody.empty();
      $checkAll.prop("checked", false);
      void loadUserList();
    } catch (err) {
      await alertModal.show({
        title: "오류 발생",
        message: "상태 변경 중 문제가 발생했습니다.",
        type: "error",
      });
    }
  });

  void loadUserList();
});
