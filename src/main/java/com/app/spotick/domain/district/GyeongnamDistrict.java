package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum GyeongnamDistrict implements District {
    GEOJE("거제"), GEOCHANG("거창"), GOSEONG("고성"), GIMHAE("김해"),
    NAMHAE("남해"), MILYANG("밀양"), SACHEON("사천"), SANCHEONG("산청"),
    YANGSAN("양산"), UIRYEONG("의령"), JINJU("진주"), CHANGNYEONG("창녕"),
    CHANGWON("창원"), TONGYEONG("통영"), HADONG("하동"), HAMAN("함안"),
    HAMYANG("함양"), HAMCHEON("함천");

    private final String displayName;

    GyeongnamDistrict(String displayName) {
        this.displayName = displayName;
    }
}