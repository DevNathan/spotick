package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum DaejeonDistrict implements District {
    DAEDEOK("대덕구"), DONG("동구"), SEO("서구"), YUSEONG("유성구"), JUNG("중구");

    private final String displayName;

    DaejeonDistrict(String displayName) {
        this.displayName = displayName;
    }
}