package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum JeonbukDistrict implements District {
    GOCHANG("고창"), GUNSAN("군산"), GIMJE("김제"), NAMWON("남원"),
    MUJU("무주"), BUAN("부안"), SUNCHANG("순창"), WANJU("완주"),
    IKSAN("익산"), IMSIL("임실"), JANGSU("장수"), JEONJU("전주"),
    JEONGEUP("정읍"), JINAN("진안");

    private final String displayName;

    JeonbukDistrict(String displayName) {
        this.displayName = displayName;
    }
}