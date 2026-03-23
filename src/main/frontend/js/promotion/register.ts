import $ from "jquery";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { alertModal } from "@/utils/alert";

$(() => {
  // ==========================================
  // 1. 썸네일 사진 미리보기 로직 (단일 이미지)
  // ==========================================
  const $fileInput = $("#thumbnailFile");
  const $previewBox = $("#imagePreview");
  const $labelBox = $("#uploadLabel");
  const $img = $("#previewImg");

  $fileInput.on("change", function (e: any) {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = function (e) {
        $img.attr("src", e.target?.result as string);
        $labelBox.hide();
        $previewBox.show();
      };
      reader.readAsDataURL(files[0]);
    }
  });

  $("#deleteImgBtn").on("click", function () {
    $fileInput.val("");
    $img.attr("src", "");
    $previewBox.hide();
    $labelBox.show();
  });

  // ==========================================
  // 2. Quill 에디터 초기화 및 이미지 업로드 핸들러
  // ==========================================
  const $hiddenContent = $("#hiddenContent");

  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      const formData = new FormData();
      formData.append("uploadFile", file);

      try {
        const res = await $.ajax({
          url: "/file/summernote/upload",
          type: "POST",
          data: formData,
          processData: false,
          contentType: false,
        });

        // 업로드 성공 시 Quill 에디터 현재 커서 위치에 이미지 삽입
        const range = quill.getSelection();
        if (range) {
          /*
           * 백엔드 DataResponse의 data 필드 자체가 완성된 파일 경로 문자열입니다.
           * 따라서 res.data를 직접 사용하여 URL을 구성합니다.
           */
          const imgUrl = `/file/sum?fileName=${res.data}`;
          quill.insertEmbed(range.index, "image", imgUrl);
        }
      } catch (err) {
        console.error("이미지 업로드 실패", err);
        void alertModal.show({
          title: "오류",
          message: "이미지 업로드에 실패했습니다.",
        });
      }
    };
  };

  const quill = new Quill("#editor", {
    theme: "snow",
    placeholder: "행사에 대한 자세한 내용을 작성해주세요...",
    modules: {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ color: [] }, { background: [] }],
          ["image", "link"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler, // 커스텀 이미지 핸들러 연결
        },
      },
    },
  });

  // 에딧 모드일 때 기존 내용을 Quill에 밀어넣기
  if ($hiddenContent.val()) {
    quill.root.innerHTML = $hiddenContent.val() as string;
  }

  // ==========================================
  // 3. 폼 서밋 전 Quill 데이터를 textarea로 동기화
  // ==========================================
  $("#promotionForm").on("submit", function () {
    const content = quill.root.innerHTML;
    // 내용이 비어있는지 체크 (Quill은 빈 상태일 때 <p><br></p>를 가짐)
    if (content === "<p><br></p>" || content.trim() === "") {
      alert("행사 내용을 입력해주세요.");
      return false;
    }
    $hiddenContent.val(content);
  });
});
