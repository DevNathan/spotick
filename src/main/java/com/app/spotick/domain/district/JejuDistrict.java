package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum JejuDistrict implements District {
    SEOGWIPO("서귀포시"), JEJU("제주시");

    private final String displayName;

    JejuDistrict(String displayName) {
        this.displayName = displayName;
    }
}