package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum JeonnamDistrict implements District {
    GANGJIN("강진"), GOHEUNG("고흥"), GOKSEONG("곡성"), GWANGYANG("광양"),
    GURYE("구례"), NAJU("나주"), DAMYANG("담양"), MOKPO("목포"),
    MUAN("무안"), BOSEONG("보성"), SUNCHEON("순천"), SINAN("신안"),
    YEOSU("여수"), YEONGGWANG("영광"), YEONGAM("영암"), WANDO("완도"),
    JANGSEONG("장성"), JANGHEUNG("장흥"), JINDO("진도"), HAMPYEONG("함평"),
    HAENAM("해남"), HWASUN("화순");

    private final String displayName;

    JeonnamDistrict(String displayName) {
        this.displayName = displayName;
    }
}