package com.app.spotick.global.security.type;

public enum OAuthType {
    KAKAO("kakao"),
    GOOGLE("google"),
    NAVER("naver")
    ;

    private final String registrationId;
    OAuthType(String registrationId) {
        this.registrationId = registrationId;
    }

    public String getRegistrationId() {
        return registrationId;
    }
}
