import $ from "jquery";
import { toast } from "@/utils/sonner";

declare const kakao: any;

/**
 * 장소 등록 및 수정 페이지의 통합 로직 모듈입니다.
 * 맵 초기화 및 기존/신규 이미지의 다중 업로드 상태를 제어합니다.
 */
$(() => {
  // ==========================================
  // 1. 카카오맵 API 연동 로직
  // ==========================================
  const initMap = (): void => {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    // 수정 모드일 경우 기존 좌표가 input에 들어있으므로 이를 초기 중앙값으로 사용한다.
    const savedLat =
      parseFloat($("#placeLat").val() as string) || 37.49947087294;
    const savedLng =
      parseFloat($("#placeLng").val() as string) || 127.0358208842;

    const mapOption = {
      center: new kakao.maps.LatLng(savedLat, savedLng),
      level: 3,
    };

    const map = new kakao.maps.Map(mapContainer, mapOption);
    const geocoder = new kakao.maps.services.Geocoder();
    const ps = new kakao.maps.services.Places();
    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(savedLat, savedLng),
    });

    // 기존 좌표가 유효하다면(수정 모드) 마커를 렌더링한다.
    if ($("#placeLat").val()) {
      marker.setMap(map);
    }

    const updateLocation = (latLng: any): void => {
      marker.setPosition(latLng);
      marker.setMap(map);

      $("#placeLat").val(latLng.getLat());
      $("#placeLng").val(latLng.getLng());

      geocoder.coord2Address(
        latLng.getLng(),
        latLng.getLat(),
        (result: any, status: any) => {
          if (status === kakao.maps.services.Status.OK) {
            const detailAddr = result[0].road_address
              ? result[0].road_address.address_name
              : result[0].address.address_name;
            $("#placeAddress").val(detailAddr);
          }
        },
      );
      map.setCenter(latLng);
    };

    kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
      updateLocation(mouseEvent.latLng);
    });

    const executeSearch = (): void => {
      const keyword = $("#search").val() as string;
      if (!keyword.trim()) {
        toast.error("검색어를 입력해주세요.");
        return;
      }

      ps.keywordSearch(keyword, (data: any, status: any) => {
        if (status === kakao.maps.services.Status.OK) {
          const place = data[0];
          const latLng = new kakao.maps.LatLng(place.y, place.x);
          updateLocation(latLng);
        } else {
          toast.error("장소를 찾을 수 없습니다.");
        }
      });
    };

    $("#mapSearchBtn").on("click", executeSearch);
    $("#search").on("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        executeSearch();
      }
    });
  };

  if (typeof kakao !== "undefined" && kakao.maps) {
    kakao.maps.load(() => {
      initMap();
    });
  } else {
    toast.error("카카오맵 API를 불러오지 못했습니다.");
  }

  // ==========================================
  // 2. 다중 이미지 업로드 통합 로직 (등록 & 수정)
  // ==========================================
  const $fileInput = $("#placeFiles");
  const $emptyState = $("#imageEmptyState");
  const $previewState = $("#imagePreviewState");
  const $slider = $("#imageSlider");
  const $prevBtn = $("#imgPrevBtn");
  const $nextBtn = $("#imgNextBtn");

  let dt = new DataTransfer();
  let currentIdx = 0;

  /**
   * UI 슬라이더 상태를 계산하고 화살표 버튼 활성화 여부를 결정합니다.
   * 기존 이미지 개수와 신규 DataTransfer 개수를 모두 합산합니다.
   */
  const updateSliderUI = (): void => {
    const savedCount = $(".is-saved").length;
    const newCount = dt.files.length;
    const totalCount = savedCount + newCount;

    if (totalCount === 0) {
      $emptyState.show();
      $previewState.hide();
      return;
    }

    $emptyState.hide();
    $previewState.show();

    $slider.css("transform", `translateX(-${currentIdx * 100}%)`);

    $prevBtn.toggle(currentIdx > 0);
    $nextBtn.toggle(currentIdx < totalCount - 1);
  };

  // 초기 렌더링 시 기존 이미지가 있다면 UI 갱신 (수정 모드 진입 시)
  updateSliderUI();

  // 신규 파일 추가 이벤트
  $fileInput.on("change", function (e: any) {
    const files = e.target.files;
    const savedCount = $(".is-saved").length;

    if (savedCount + dt.files.length + files.length > 5) {
      toast.error("사진은 기존 사진 포함 최대 5장까지만 업로드 가능합니다.");
      return;
    }

    Array.from(files).forEach((file: any) => {
      dt.items.add(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const li = `
            <div class="image-uploader__item">
                <img src="${ev.target?.result}" alt="신규 추가 이미지">
                <button type="button" class="image-uploader__delete-btn" data-new-name="${file.name}"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
        $slider.append(li);
      };
      reader.readAsDataURL(file);
    });

    ($fileInput[0] as HTMLInputElement).files = dt.files;
    updateSliderUI();
  });

  $prevBtn.on("click", () => {
    if (currentIdx > 0) {
      currentIdx--;
      updateSliderUI();
    }
  });

  $nextBtn.on("click", () => {
    const totalCount = $(".is-saved").length + dt.files.length;
    if (currentIdx < totalCount - 1) {
      currentIdx++;
      updateSliderUI();
    }
  });

  // 통합 삭제 로직 (이벤트 위임)
  $slider.on("click", ".image-uploader__delete-btn", function () {
    const $btn = $(this);
    const savedId = $btn.data("saved-id");
    const newName = $btn.data("new-name");

    if (savedId) {
      // 1. 기존 이미지 삭제 로직: UI에서 지우고 서버 전송용 hidden input도 삭제한다.
      $(`input[name="saveFileIdList"][value="${savedId}"]`).remove();
    } else if (newName) {
      // 2. 신규 추가 이미지 삭제 로직: UI에서 지우고 DataTransfer 배열에서도 뺀다.
      const newDt = new DataTransfer();
      Array.from(dt.files).forEach((file) => {
        if (file.name !== newName) newDt.items.add(file);
      });
      dt = newDt;
      ($fileInput[0] as HTMLInputElement).files = dt.files;
    }

    // UI 요소 제거
    $btn.closest(".image-uploader__item").remove();

    // 삭제 시 빈 공간을 채우기 위해 인덱스 뒤로 당기기
    const totalCount = $(".is-saved").length + dt.files.length;
    if (currentIdx >= totalCount && currentIdx > 0) {
      currentIdx--;
    }

    updateSliderUI();
  });

  // ==========================================
  // 3. 폼 제출 방어 로직
  // ==========================================
  $("#registerForm").on("submit", function () {
    const totalCount = $(".is-saved").length + dt.files.length;

    // 컨트롤러 검증 조건과 동일하게 프론트엔드에서도 총 5장 여부를 확인한다.
    if (totalCount < 5) {
      toast.error("장소 사진은 총 5장을 등록해야 합니다.");
      return false;
    }

    $("#submitBtn").prop("disabled", true).text("처리 중...");
  });
});
