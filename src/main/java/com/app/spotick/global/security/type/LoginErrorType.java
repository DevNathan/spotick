package com.app.spotick.global.security.type;

import lombok.Getter;

@Getter
public enum LoginErrorType {
    UsernameNotFoundException("아이디를 다시 확인해주세요"),
    BadCredentialsException("비밀번호를 다시 확인해주세요"),
    DisabledException("해당 계정이 비활성화되어 있습니다.");
    private final String errorMessage;

    LoginErrorType(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}
