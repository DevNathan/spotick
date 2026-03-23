package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum GwangjuDistrict implements District {
    GWANGSAN("광산구"), NAM("남구"), DONG("동구"), BUK("북구"), SEO("서구");

    private final String displayName;

    GwangjuDistrict(String displayName) {
        this.displayName = displayName;
    }
}