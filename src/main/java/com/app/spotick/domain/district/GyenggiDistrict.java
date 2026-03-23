package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum GyenggiDistrict implements District {
    GAPYEONG("가평"), GOYANG("고양"), GWACHEON("과천"), GWANGMYEONG("광명"),
    GWANGJU("광주"), GURI("구리"), GUNPO("군포"), GIMPO("김포"),
    NAMYANGJU("남양주"), DONGDUCHEON("동두천"), BUCHEON("부천"), SEONGNAM("성남"),
    SUWON("수원"), SIHEUNG("시흥"), ANSAN("안산"), ANSEONG("안성"),
    ANYANG("안양"), YANGJU("양주"), YANGPYEONG("양평"), YEOJU("여주"),
    YEONCHEON("연천"), OSAN("오산"), YONGIN("용인"), UIWANG("의왕"),
    UIJEONGBU("의정부"), ICHEON("이천"), PAJU("파주"), PYEONGTAEK("평택"),
    POCHEON("포천"), HANAM("하남"), HWASEONG("화성");

    private final String displayName;

    GyenggiDistrict(String displayName) {
        this.displayName = displayName;
    }
}