package com.app.spotick.global.util.type;

import lombok.Getter;

@Getter
public enum TicketSortType {
    POPULARITY("인기순"),
    NEWEST("최신순"),
    INTEREST("관심순"),
    PRICE_LOW_TO_HIGH("낮은 가격순"),
    PRICE_HIGH_TO_LOW("높은 가격순"),
    VIEWS("조회순");

    private final String displayName;

    TicketSortType(String displayName) {
        this.displayName = displayName;
    }
}
