package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum DaeguDistrict implements District {
    GUNWI("군위군"), NAM("남구"), DALSEO("달서구"), DALSEONG("달성군"),
    DONG("동구"), BUK("북구"), SEO("서구"), SUSEONG("수성구"), JUNG("중구");

    private final String displayName;

    DaeguDistrict(String displayName) {
        this.displayName = displayName;
    }
}