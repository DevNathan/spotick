package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum IncheonDistrict implements District {
    GANGHWA("강화군"), ONGJIN("옹진군"), JUNG("중구"), DONG("동구"),
    MICHUHOL("미추홀구"), YEONSU("연수구"), NAMDONG("남동구"), BUPYEONG("부평구"),
    GYEYANG("계양구"), SEO("서구");

    private final String displayName;

    IncheonDistrict(String displayName) {
        this.displayName = displayName;
    }
}