package com.app.spotick.global.config;

import kr.co.bootpay.pg.Bootpay;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;

/*
 * Bootpay API 연동을 위한 Config
 * application.yml의 설정값을 주입받아 Bootpay 클라이언트 객체를 스프링 빈으로 등록합니다.
 */
@Slf4j
@Configuration
public class BootpayConfig {

    @Value("${bootpay.restApi}")
    private String REST_API;

    @Value("${bootpay.secret}")
    private String SECRET_KEY;

    /*
     * Bootpay 객체를 초기화하고 액세스 토큰을 발급받아 반환합니다.
     * 발급 과정에서 오류가 발생할 경우 애플리케이션 기동을 중단하거나 예외를 발생시켜 조기에 문제를 감지합니다.
     */
    @Bean
    public Bootpay bootpay() {
        Bootpay bootpay = new Bootpay(REST_API, SECRET_KEY);
        try {
            HashMap<String, Object> token = bootpay.getAccessToken();
            if (token.get("error_code") != null) {
                log.error("Bootpay 토큰 발급 실패: {}", token);
                throw new RuntimeException("Bootpay API 인증 토큰을 발급받지 못했습니다.");
            }
            log.info("Bootpay 클라이언트 초기화 및 토큰 발급 완료");
        } catch (Exception e) {
            log.error("Bootpay 초기화 중 시스템 에러 발생: {}", e.getMessage());
            throw new RuntimeException("Bootpay 초기화 에러", e);
        }
        return bootpay;
    }
}