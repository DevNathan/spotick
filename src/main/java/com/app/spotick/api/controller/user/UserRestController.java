package com.app.spotick.api.controller.user;

import com.app.spotick.api.response.DataResponse;
import com.app.spotick.api.dto.user.FindIdCertDto;
import com.app.spotick.api.dto.user.UserFindEmailDto;
import com.app.spotick.api.dto.user.UserFindPwDto;
import com.app.spotick.service.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/users/api")
@RequiredArgsConstructor
public class UserRestController {
    private final UserService userService;

    @GetMapping("/valid/email/{email}")
    public ResponseEntity<Boolean> isValidEmail(@PathVariable("email") String email) {
        return ResponseEntity.ok(!userService.isExistsEmail(email));
    }

    @GetMapping("/valid/nickname/{nickname}")
    public ResponseEntity<Boolean> isValidNickname(@PathVariable("nickname") String nickname) {
        return ResponseEntity.ok(userService.isValidNickname(nickname));
    }

    @PostMapping("/tel/cert/code")
    public ResponseEntity<DataResponse<Boolean>> sendTelCertCode(@RequestBody FindIdCertDto findIdCertDto) {
        DataResponse<Boolean> resp = null;
        String nickname = findIdCertDto.getNickname();
        String tel = findIdCertDto.getTel();

        if (!userService.checkUserByNicknameAndTel(nickname, tel)) {
            resp = new DataResponse<>(false, "닉네임과 전화번호를 확인해주세요", false);
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(resp);
        }
        userService.sendAuthCodeToTel(tel);
        resp = new DataResponse<>(true, "인증번호를 전송했습니다.", true);
        return ResponseEntity.ok().body(resp);
    }

    @PostMapping("/find/email")
    public ResponseEntity<DataResponse<UserFindEmailDto.Response>> findEmail(@RequestBody UserFindEmailDto.Request findEmailReq) {
        String tel = findEmailReq.getTel();
        String nickname = findEmailReq.getNickname();
        UserFindEmailDto.Response userFindEmailDto = null;
        DataResponse<UserFindEmailDto.Response> findEmailResp = new DataResponse<>(false, "", null);

        if (!userService.isValidCertCode(findEmailReq.getCertCode(), tel)) {
            findEmailResp.setMessage("인증번호를 다시 입력해 주세요");
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(findEmailResp);
        }

        try {
            userFindEmailDto = userService.findUserFindEmailDto(nickname, tel);
        } catch (IllegalStateException e) {
            e.printStackTrace();
            findEmailResp.setMessage("전화번호와 닉네임을 확인해 주세요");
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(findEmailResp);
        }
        findEmailResp.setSuccess(true);
        findEmailResp.setData(userFindEmailDto);
        return ResponseEntity.ok(findEmailResp);
    }

    @PostMapping("/email/cert/code")
    public ResponseEntity<DataResponse<Boolean>> sendEmailCertCode(@RequestBody String email) {
        DataResponse<Boolean> response = new DataResponse<>(true,"",true);

        if(!userService.isExistsEmail(email)){
//            해당 이메일이 존재하지 않을 경우
            response.setSuccess(false);
            response.setData(false);
            response.setMessage("등록되지 않은 이메일입니다. 다시 확인해 주세요");
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(response);
        }
        try {
            userService.sendCodeToEmail(email);
        } catch (Exception e) {
            response.setSuccess(false);
            response.setData(false);
            response.setMessage("서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");

            log.error("Exception [Err_Msg]: {}", e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/find/password")
    public ResponseEntity<Boolean> findPassword(@RequestBody UserFindPwDto findPwDto) {
        System.out.println("findPwDto = " + findPwDto);
        String email = findPwDto.getEmail();
        String certCode = findPwDto.getCertCode();
        if(!userService.isValidCertCode(certCode,email)){
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(false);
        }
        return ResponseEntity.ok(true);
    }


}
















