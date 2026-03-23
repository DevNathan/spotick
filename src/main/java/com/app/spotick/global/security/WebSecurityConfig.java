package com.app.spotick.global.security;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class WebSecurityConfig {
    private final OAuth2UserService oAuth2UserService;
    private final AuthenticationFailureHandler authenticationFailureHandler;

    @Bean
    public static PasswordEncoder bCryptPasswordEncoder() {
//        모든 작업마무리되고 새롭게 create할 때 기본설정메소드로 교체 고려
//        return PasswordEncoderFactories.createDelegatingPasswordEncoder(); 
        return new BCryptPasswordEncoder();
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.ignoring()
                .requestMatchers(PathRequest.toStaticResources().atCommonLocations());
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
//               spring security csrf 방지 비활성화
//               기본적으로 logout은 post방식이지만
//                csrf보호를 비활성화하면 get방식으로 사용할 수 있다.
//                csrf보호를 적용할지는 프로젝트 진행 및 완성도에 따라서 고려(현재는 비활성화)
                .csrf(AbstractHttpConfigurer::disable)

                .authorizeHttpRequests((requests) -> requests
//                        해당  url로 들어온 요청은 인증을 해야한다
                                .requestMatchers("/mypage/**").authenticated()
                                .requestMatchers("/place/api/list").permitAll()
                                .requestMatchers("/place/api/**").authenticated()
                                .requestMatchers("/place/register").authenticated()
                                .requestMatchers("/place/edit/*").authenticated()
                                .requestMatchers("/place/check/reserve").authenticated()
                                .requestMatchers("/promotion/register").authenticated()
                                .requestMatchers("/admin/**","/admins/**").hasRole("ADMIN")
//                        해당  url로 들어온 요청은 인증과 권한확인을 해야한다
//                                .requestMatchers("/admin")
//                                .hasAnyRole("USER", "ADMIN")
//                                Role로 회원의 권한을 검사할 경우 db에 ROLE_접두어를 붙여 저장한다.( ex. ROLE_USER, ROLE_ADMIN )
//                                .hasAnyAuthority("USER", "ADMIN")
                                // hasAnyAuthority()메소드로 검사하는 경우 해당 문자열 그대로 검사한다.

//                        그 밖의 요청은 허용한다.
                                .anyRequest().permitAll()

                )

                .formLogin((form) -> form
//                        로그인 페이지의 url설정
                                .loginPage("/user/login")
                                .loginProcessingUrl("/user/login")
                                .defaultSuccessUrl("/")
                                .failureHandler(authenticationFailureHandler)
//                                .successHandler(new CustomLoginSuccessHandler("/"))
                )

                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/user/login")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                )

                .exceptionHandling(exceptionHandling -> exceptionHandling
                        .accessDeniedPage("/")
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.sendRedirect("/user/login?req=true");
                        })
                )

                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/user/login")
                        .userInfoEndpoint(endpoint ->
                                endpoint.userService(oAuth2UserService))
                        .defaultSuccessUrl("/")
                )
        ;

        return http.build();
    }


}