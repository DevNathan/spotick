package com.app.spotick.global.util.type;

import lombok.Getter;

@Getter
public enum PlaceReservationSortType {
    UPCOMING("예약 시간순"),
    NEWEST("최신순"),
    PRICE_LOW_TO_HIGH("낮은 가격순"),
    PRICE_HIGH_TO_LOW("높은 가격순"),
    RATING_HIGH("평점 높은 순");

    private final String displayName;

    PlaceReservationSortType(String displayName) {
        this.displayName = displayName;
    }
}
