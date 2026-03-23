package com.app.spotick.controller.ticket;

import com.app.spotick.domain.dto.ticket.TicketDetailDto;
import com.app.spotick.domain.dto.ticket.TicketEditDto;
import com.app.spotick.domain.dto.ticket.TicketListDto;
import com.app.spotick.domain.dto.ticket.TicketRegisterDto;
import com.app.spotick.domain.dto.user.UserDetailsDto;
import com.app.spotick.global.util.type.TicketSortType;
import com.app.spotick.service.ticket.TicketService;
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
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;

@Controller
@Slf4j
@RequestMapping("/ticket")
@RequiredArgsConstructor
public class TicketController {
    private final TicketService ticketService;

    @GetMapping
    public String goToList(Model model) {
        return "ticket/list";
    }

    @GetMapping("/{ticketId}")
    public String goToDetail(@PathVariable("ticketId") Long ticketId,
                             @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                             Model model) {

        Long userId = userDetailsDto == null ? null : userDetailsDto.getId();

        TicketDetailDto ticketDetail = ticketService.findTicketDetailById(ticketId, userId);

        model.addAttribute("ticketDetail", ticketDetail);

        return "ticket/detail";
    }

    /// /////////////////////////////////////////////// 티켓 등록 //////////////////////////////////////////////////
    @GetMapping("/register")
    public String goToRegister(@ModelAttribute("ticketRegisterDto") TicketRegisterDto ticketRegisterDto) {
        return "ticket/register";
    }

    @PostMapping("/register")
    public String ticketRegister(@Valid TicketRegisterDto ticketRegisterDto,
                                 BindingResult result,
                                 Model model,
                                 @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        ticketRegisterDto.setUserId(userDetailsDto.getId());

        if (result.hasErrors()) {
            return "/ticket/register";
        }

        try {
            ticketService.registerTicket(ticketRegisterDto, userDetailsDto.getId());
        } catch (IOException e) {
            log.error("Exception [Err_Msg]: {}", e.getMessage());
            model.addAttribute("registerError", "서비스 저장중 오류가 발생 했습니다. 다시 시도해 주세요.");
            return "/ticket/register";
        }

        return "redirect:/ticket/list";
    }

    /// /////////////////////////////////////////////// 티켓 수정 //////////////////////////////////////////////////
    @GetMapping("/edit/{ticketId}")
    public String goToTicketEdit(@PathVariable("ticketId") Long ticketId,
                                 @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                                 Model model) {

        TicketEditDto ticketEditDto = ticketService.findTicketEditById(ticketId, userDetailsDto.getId());

        model.addAttribute("ticketEditDto", ticketEditDto);
        return "/ticket/register";
    }

    @PostMapping("/edit/{ticketId}")
    public String ticketEdit(@PathVariable("ticketId") String ticketId,
                             @Valid @ModelAttribute("TicketEditDto") TicketEditDto ticketEditDto,
                             BindingResult result,
                             @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                             RedirectAttributes redirectAttributes) {

        System.out.println("ticketEditDto = " + ticketEditDto);

        if (result.hasErrors()) {
            for (FieldError error : result.getFieldErrors()) {
                redirectAttributes.addFlashAttribute(error.getField() + "Error", error.getDefaultMessage());
            }
            return "redirect:/ticket/edit/" + ticketId;
        }

        try {
            ticketService.updateTicket(ticketEditDto, userDetailsDto.getId());
        } catch (IOException e) {
            log.error("Exception [Err_Msg]: {}", e.getMessage());
            return "redirect:/ticket/edit/" + ticketId;
        }

        return "redirect:/mypage/tickets";
    }
}
