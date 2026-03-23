package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum UlsanDistrict implements District {
    NAM("남구"), DONG("동구"), BUK("북구"), ULJU("울주군"), JUNG("중구");

    private final String displayName;

    UlsanDistrict(String displayName) {
        this.displayName = displayName;
    }
}