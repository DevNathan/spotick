package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum ChungnamDistrict implements District {
    GYERYONG("계룡"), GONGJU("공주"), GEUMSAN("금산"), NONSAN("논산"),
    DANGJIN("당진"), BORYEONG("보령"), BUYEO("부여"), SEOSAN("서산"),
    SEOCHEON("서천"), ANSAN("안산"), YESAN("예산"), CHEONAN("천안"),
    CHEONGYANG("청양"), TAEAN("태안"), HONGSEONG("홍성");

    private final String displayName;

    ChungnamDistrict(String displayName) {
        this.displayName = displayName;
    }
}