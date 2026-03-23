package com.app.spotick.global.util.search;

import lombok.Data;

import java.util.List;

@Data
public class DistrictFilter {
    private String region;
    private List<String> district;

    public DistrictFilter(String region, List<String> district) {
        this.region = region;
        this.district = district;
    }
}
