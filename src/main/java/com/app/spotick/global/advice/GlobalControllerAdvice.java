package com.app.spotick.global.advice;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
public class GlobalControllerAdvice {

    @Value("${kakao.js}")
    private String kakaoJsKey;

    @Value("${bootpay.javascriptKey}")
    private String bootpayJsKey;

    @ModelAttribute("kakaoJsKey")
    public String globalKakaoJsKey() {
        return kakaoJsKey;
    }

    @ModelAttribute("bootpayJsKey")
    public String globalBootpayJsKey() {
        return bootpayJsKey;
    }
}