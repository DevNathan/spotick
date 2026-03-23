import $ from "jquery";

export const ticketService = (() => {
  const getList = (
    page: number,
    category: string,
    ratingType: string,
    sortType: string,
    region: string,
    districts: string[],
    keyword: string,
  ): JQuery.jqXHR => {
    const params = new URLSearchParams({
      page: page.toString(),
      sortType: sortType,
    });

    if (category !== "ALL") params.append("category", category);
    if (ratingType !== "no") params.append("ratingType", ratingType);
    if (region) params.append("district", region);
    districts.forEach((d) => params.append("detailDistrict", d));
    if (keyword) params.append("keyword", keyword);

    return $.ajax({
      url: `/ticket/api/list?${params.toString()}`,
      method: "GET",
    });
  };

  const toggleLike = (
    ticketId: string | number,
    currentStatus: boolean,
  ): JQuery.jqXHR => {
    return $.ajax({
      url: `/ticket/like?ticketId=${ticketId}&status=${currentStatus}`,
      method: "GET",
    });
  };

  return { getList, toggleLike };
})();
