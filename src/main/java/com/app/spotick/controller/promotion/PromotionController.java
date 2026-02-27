package com.app.spotick.controller.promotion;

import com.app.spotick.domain.dto.promotion.*;
import com.app.spotick.domain.dto.user.UserDetailsDto;
import com.app.spotick.global.util.type.PromotionSortType;
import com.app.spotick.service.promotion.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Controller
@RequestMapping("/promotion")
@RequiredArgsConstructor
public class PromotionController {
    private final PromotionService promotionService;

    @GetMapping
    public String goToList(Model model) {
        Map<String, Object> data = new HashMap<>();
        Pageable pageable = PageRequest.of(0, 12);

        List<PromotionRecommendListDto> recommendations = promotionService.getRecommendPromotionBoards();
        Slice<PromotionListDto> promotionList = promotionService.getPromotionBoards(pageable, null, PromotionSortType.NEWEST, null);

        data.put("recommendations", recommendations);
        data.put("promotionList", promotionList);

        model.addAttribute("data", data);
        return "promotion/list";
    }

    @GetMapping("/{id}")
    public String goToDetail(@PathVariable("id") Long promotionId,
                             @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                             Model model) {

        Long userId = userDetailsDto == null ? null : userDetailsDto.getId();

        PromotionDetailDto content = promotionService.getPromotionBoardById(promotionId, userId);

        model.addAttribute("promotion", content);
        return "promotion/detail";
    }

    ///////////////////////////////////////////// 프로모션 등록 //////////////////////////////////////////////
    @GetMapping("/register")
    public String promotionRegister(@ModelAttribute("promotionRegisterDto")
                                    PromotionRegisterDto promotionRegisterDto) {
        return "promotion/register";
    }

    @PostMapping("/register")
    public String promotionRegister(@Valid PromotionRegisterDto promotionRegisterDto,
                                    BindingResult result,
                                    @AuthenticationPrincipal UserDetailsDto userDetailsDto) throws IOException {
        promotionRegisterDto.setUserId(userDetailsDto.getId());

        System.out.println("promotionRegisterDto = " + promotionRegisterDto);

        if (result.hasErrors()) {
            return "/promotion/register";
        }

        Long id = promotionService.promotionBoardSave(promotionRegisterDto);

        return "redirect:/promotion/" + id;
    }

    ///////////////////////////////////////////// 프로모션 수정 //////////////////////////////////////////////
    @GetMapping("/{id}/edit")
    public String goToEdit(@PathVariable("id") Long promotionId,
                           @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                           Model model) {
        PromotionEditDto content = promotionService.getPromotionBoardEdit(promotionId, userDetailsDto.getId());

        model.addAttribute("promotion", content);
        return "promotion/edit";
    }

    @PostMapping("/edit")
    public String editBoard(@Valid PromotionEditDto promotionEditDto,
                            BindingResult result,
                            @AuthenticationPrincipal UserDetailsDto userDetailsDto) throws IOException {
        promotionEditDto.setUserId(userDetailsDto.getId());

        System.out.println("promotionEditDto = " + promotionEditDto);

        if (result.hasErrors()) {
            return "/promotion/register";
        }

        Long id = promotionService.updatePromotionBoard(promotionEditDto);

        return "redirect:/promotion/" + id;
    }
}
