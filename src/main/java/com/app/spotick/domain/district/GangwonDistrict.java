package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum GangwonDistrict implements District {
    GANGNEUNG("강릉"), GOSEONG("고성"), DONGHAE("동해"), SAMCHEOK("삼척"),
    SOKCHO("속초"), YANGGU("양구"), YANGYANG("양양"), YEONGWOL("영월"),
    WONJU("원주"), INJE("인제"), JEONGSEON("정선"), CHEORWON("철원"),
    CHUNCHEON("춘천"), TAEBAEK("태백"), PYEONGCHANG("평창"), HONGCHON("홍촌"),
    HWACHEON("화천"), HOENGSEONG("횡성");

    private final String displayName;

    GangwonDistrict(String displayName) {
        this.displayName = displayName;
    }
}