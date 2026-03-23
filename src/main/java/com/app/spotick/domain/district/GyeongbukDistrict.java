package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum GyeongbukDistrict implements District {
    GYEONGSAN("경산"), GYEONGJU("경주"), GORYEONG("고령"), GUMI("구미"),
    GUNWI("군위"), GIMCHEON("김천"), MUNGYEONG("문경"), BONGHWA("봉화"),
    SANGJU("상주"), SEONGJU("성주"), ANDONG("안동"), YEONGDEOK("영덕"),
    YEONGYANG("영양"), YEONGJU("영주"), YEONGCHEON("영천"), YECHEON("예천"),
    ULLEUNG("울릉"), ULJIN("울진"), UISEONG("의성"), CHEONGDO("청도"),
    CHEONGSONG("청송"), CHILGOK("칠곡"), POHANG("포항");

    private final String displayName;

    GyeongbukDistrict(String displayName) {
        this.displayName = displayName;
    }
}