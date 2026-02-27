package com.app.spotick.global.util.search;

import lombok.Data;

import java.util.List;

@Data
public class DistrictFilter {
    private String district;
    private List<String> detailDistrict;

    public DistrictFilter(String district, List<String> detailDistrict) {
        this.district = district;
        this.detailDistrict = detailDistrict;
    }
}
