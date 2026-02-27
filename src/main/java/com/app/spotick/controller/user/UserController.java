package com.app.spotick.controller.user;

import com.app.spotick.domain.dto.user.UserJoinDto;
import com.app.spotick.domain.dto.user.UserModifyPwDto;
import com.app.spotick.global.security.type.LoginErrorType;
import com.app.spotick.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

@Controller
@RequestMapping("/user/*")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    @GetMapping("/login")
    public String userLogin(@RequestParam(name = "gm", required = false) String guideMsg,
                            @RequestParam(name = "errorType", required = false) LoginErrorType errorType,
                            Model model){
        if(guideMsg!=null){
            model.addAttribute("guideMsg",true);
        }

        if(errorType != null){
            model.addAttribute("errorMsg",errorType.getErrorMessage());
        }
        return "user/login";
    }


    @GetMapping("/join")
    public String userJoin(){
        return "user/join";
    }

    @PostMapping("/join")
    public RedirectView userJoin(UserJoinDto userJoinDto){
        userService.join(userJoinDto);
        return new RedirectView("/user/login");
    }

    @GetMapping("/find")
    public String userFind(){
        return "user/find";
    }

    @PostMapping("/modify/password")
    public RedirectView modifyPassword(UserModifyPwDto userModifyPwDto){
        userService.updatePassword(userModifyPwDto.getEmail(),userModifyPwDto.getPassword());
        return new RedirectView("/user/login");
    }
}











