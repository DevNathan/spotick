package com.app.spotick.global.security;

import com.app.spotick.global.security.type.LoginErrorType;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.ExceptionMappingAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public class CustomLoginFailureHandler extends ExceptionMappingAuthenticationFailureHandler {
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        final String DEFAULT_URL = "/user/login?error=true";
        setDefaultFailureUrl(DEFAULT_URL);

        Map<String, String> failureUrlMap = new HashMap<>();

        failureUrlMap.put(UsernameNotFoundException.class.getName(), DEFAULT_URL + "&errorType=" + LoginErrorType.UsernameNotFoundException.name());
        failureUrlMap.put(BadCredentialsException.class.getName(), DEFAULT_URL + "&errorType=" + LoginErrorType.BadCredentialsException.name());
        failureUrlMap.put(DisabledException.class.getName(), DEFAULT_URL + "&errorType=" + LoginErrorType.DisabledException.name());

        setExceptionMappings(failureUrlMap);
        super.onAuthenticationFailure(request, response, exception);
    }
}
