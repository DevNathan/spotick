package com.app.spotick.global.util.type;

import lombok.Getter;

@Getter
public enum PromotionSortType {
    NEWEST("최신순"),
    INTEREST("관심순");

    private final String displayName;

    PromotionSortType(String displayName) {
        this.displayName = displayName;
    }
}
