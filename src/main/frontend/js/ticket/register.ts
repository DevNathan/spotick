import $ from "jquery";
import flatpickr from "flatpickr";
import { Korean } from "flatpickr/dist/l10n/ko.js";

declare const kakao: any;

$(() => {
  // ==========================================
  // 1. 행사 기간 Flatpickr (기존 값 보장)
  // ==========================================
  const initFlatpickr = () => {
    const startVal = $("#startDate").val() as string;
    const endVal = $("#endDate").val() as string;

    const fpOptions: any = {
      locale: Korean,
      mode: "range",
      dateFormat: "Y.m.d",
      onChange: function (selectedDates: Date[]) {
        if (selectedDates.length === 2) {
          const start = flatpickr.formatDate(selectedDates[0], "Y-m-d");
          const end = flatpickr.formatDate(selectedDates[1], "Y-m-d");
          $("#startDate").val(start);
          $("#endDate").val(end);
        }
      },
    };

    // 서버에서 넘어온 기존 값이 있으면 캘린더에 기본값으로 세팅 (화면에 자동 노출됨)
    if (startVal && endVal) {
      fpOptions.defaultDate = [startVal, endVal];
    }

    flatpickr("#eventDates", fpOptions);
  };

  initFlatpickr();

  // ==========================================
  // 2. 카카오맵 API 연동 (방어막 강화)
  // ==========================================
  const initMap = () => {
    if (typeof kakao === "undefined" || !kakao.maps) {
      console.error(
        "Kakao Map API가 로드되지 않았습니다. HTML 스크립트 태그를 확인하세요.",
      );
      return;
    }

    kakao.maps.load(() => {
      const mapContainer = document.getElementById("map");
      if (!mapContainer) return;

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
        position: mapOption.center,
      });

      if ($("#placeLat").val()) marker.setMap(map);

      kakao.maps.event.addListener(map, "click", function (mouseEvent: any) {
        geocoder.coord2Address(
          mouseEvent.latLng.getLng(),
          mouseEvent.latLng.getLat(),
          function (result: any, status: any) {
            if (status === kakao.maps.services.Status.OK) {
              const detailAddr = result[0].road_address
                ? result[0].road_address.address_name
                : result[0].address.address_name;
              $("#placeAddress").val(detailAddr);
              $("#placeLat").val(mouseEvent.latLng.getLat());
              $("#placeLng").val(mouseEvent.latLng.getLng());

              marker.setPosition(mouseEvent.latLng);
              marker.setMap(map);
            }
          },
        );
      });

      $("#mapSearchBtn").on("click", function () {
        const keyword = $("#search").val() as string;
        if (!keyword.trim()) return;

        ps.keywordSearch(keyword, function (data: any, status: any) {
          if (status === kakao.maps.services.Status.OK) {
            const bounds = new kakao.maps.LatLngBounds();
            for (let i = 0; i < data.length; i++) {
              bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));
            }
            map.setBounds(bounds);
          }
        });
      });
    });
  };

  initMap();

  // ==========================================
  // 3. 대표 사진 미리보기 로직
  // ==========================================
  const $fileInput = $("#ticketFile, #newTicketFile");
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
  // 4. 등급(Grade) 동적 제어 로직 (수정 모드 완벽 분기)
  // ==========================================
  const MAX_GRADE = 4;
  const $gradeList = $("#gradeList");
  const $addGradeBtn = $("#addGradeBtn");

  const checkGradeInputs = (): void => {
    // 수정 모드라서 추가 버튼 자체가 없으면 로직을 건너뛴다.
    if ($addGradeBtn.length === 0) return;

    let allFilled = true;
    // 수정 불가 상태인 readonly 요소는 검사에서 제외한다.
    $(".tk-grade__item input")
      .not("[readonly]")
      .each(function () {
        if ($(this).val() === "") allFilled = false;
      });
    const count = $(".tk-grade__item").length;
    $addGradeBtn.prop("disabled", count >= MAX_GRADE || !allFilled);

    if (count > 1) {
      $(".tk-grade__remove-btn").show();
    } else {
      $(".tk-grade__remove-btn").hide();
    }
  };

  $addGradeBtn.on("click", function () {
    const count = $(".tk-grade__item").length;
    if (count >= MAX_GRADE) return;

    const $clone = $(".tk-grade__item").first().clone();

    $clone.find("input").each(function () {
      const name = $(this).attr("name") as string;
      $(this).attr("name", name.replace(/\[\d+\]/g, `[${count}]`));
      $(this).val("");
    });

    $gradeList.append($clone);
    checkGradeInputs();
  });

  $gradeList.on("click", ".tk-grade__remove-btn", function () {
    if ($(".tk-grade__item").length > 1) {
      $(this).closest(".tk-grade__item").remove();

      $(".tk-grade__item").each(function (index) {
        $(this)
          .find("input")
          .each(function () {
            const name = $(this).attr("name") as string;
            $(this).attr("name", name.replace(/\[\d+\]/g, `[${index}]`));
          });
      });
      checkGradeInputs();
    }
  });

  $gradeList.on("input", "input:not([readonly])", checkGradeInputs);
  checkGradeInputs();
});
