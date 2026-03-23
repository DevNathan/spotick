package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum ChungbukDistrict implements District {
    GOESAN("괴산"), DANYANG("단양"), BOEUN("보은"), YEONGDONG("영동"),
    OKCHEON("옥천"), EUMSEONG("음성"), JECHEON("제천"), JEUNGPYEONG("증평"),
    JINCHEON("진천"), CHEONGJU("청주"), CHUNGJU("충주");

    private final String displayName;

    ChungbukDistrict(String displayName) {
        this.displayName = displayName;
    }
}