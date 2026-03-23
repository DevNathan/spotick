import $ from "jquery";

/**
 * 지역 필터 모달을 초기화하고 이벤트를 바인딩하는 글로벌 모듈입니다.
 */
export const initDistrictFilter = (
  modalSelector: string,
  openBtnSelector: string,
  closeBtnSelectors: string,
  submitBtnSelector: string,
  resetBtnSelector: string,
  onSubmitCallback: (filterData: {
    region: string;
    district: string[];
  }) => void,
) => {
  const $modal = $(modalSelector);
  const $regions = $modal.find(".global-filter-modal__region-btn");
  const $districtGroups = $modal.find(".global-filter-modal__district-group");
  const $checkboxes = $modal.find(".global-checkbox__input");
  const $tagsContainer = $modal.find(".global-filter-modal__selected-tags");

  $(openBtnSelector).on("click", () =>
    $modal.addClass("global-filter-modal--active"),
  );
  $(closeBtnSelectors).on("click", () =>
    $modal.removeClass("global-filter-modal--active"),
  );

  $regions.on("click", function () {
    $regions.removeClass("global-filter-modal__region-btn--active");
    $(this).addClass("global-filter-modal__region-btn--active");
    const target = $(this).data("target");
    $districtGroups.removeClass("global-filter-modal__district-group--active");
    $(`#${target.replace(/\s/g, "\\ ")}`).addClass(
      "global-filter-modal__district-group--active",
    );
  });

  const updateTags = () => {
    $tagsContainer.empty();
    $modal.find(".global-checkbox__input--item:checked").each(function () {
      $tagsContainer.append(`
        <div class="global-filter-modal__tag" data-val="${$(this).val()}">
            ${$(this).val()} <i class="fa-solid fa-xmark global-filter-modal__tag-close"></i>
        </div>
      `);
    });
  };

  $checkboxes.on("change", function () {
    const region = $(this).data("region");
    if ($(this).hasClass("global-checkbox__input--all")) {
      $(`.global-checkbox__input--item[data-region="${region}"]`).prop(
        "checked",
        $(this).prop("checked"),
      );
    } else {
      const allChecked =
        $(
          `.global-checkbox__input--item[data-region="${region}"]:not(:checked)`,
        ).length === 0;
      $(`.global-checkbox__input--all[data-region="${region}"]`).prop(
        "checked",
        allChecked,
      );
    }
    updateTags();
  });

  $tagsContainer.on("click", ".global-filter-modal__tag-close", function () {
    const val = $(this).parent().data("val");
    $(`.global-checkbox__input[value="${val}"]`)
      .prop("checked", false)
      .trigger("change");
  });

  $(resetBtnSelector).on("click", () => {
    $checkboxes.prop("checked", false);
    updateTags();
  });

  $(submitBtnSelector).on("click", () => {
    const selectedDistricts: string[] = [];
    let selectedRegion = "";

    const $selectedItems = $modal.find(".global-checkbox__input--item:checked");

    if ($selectedItems.length > 0) {
      $selectedItems.each(function () {
        selectedDistricts.push($(this).val() as string);
        selectedRegion = $(this).data("region");
      });
    } else {
      const $selectedAll = $modal.find(".global-checkbox__input--all:checked");
      if ($selectedAll.length > 0) {
        selectedRegion = $selectedAll.first().data("region");
      }
    }

    $modal.removeClass("global-filter-modal--active");
    onSubmitCallback({ region: selectedRegion, district: selectedDistricts });
  });
};
