package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum BusanDistrict implements District {
    GANGSEO("강서구"), GEUMJEONG("금정구"), GIJANG("기장군"), NAM("남구"),
    DONG("동구"), DONGNAE("동래구"), BUSANJIN("부산진구"), BUK("북구"),
    SASANG("사상구"), SAHA("사하구"), SEO("서구"), SUYEONG("수영구"),
    YEONJE("연제구"), YEONGDO("영도구"), JUNG("중구"), HAEUNDAE("해운대구");

    private final String displayName;

    BusanDistrict(String displayName) {
        this.displayName = displayName;
    }
}