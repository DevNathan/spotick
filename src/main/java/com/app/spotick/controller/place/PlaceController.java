package com.app.spotick.controller.place;

import com.app.spotick.domain.district.Region;
import com.app.spotick.domain.dto.place.PlaceDetailDto;
import com.app.spotick.domain.dto.place.PlaceEditDto;
import com.app.spotick.domain.dto.place.PlaceListDto;
import com.app.spotick.domain.dto.place.PlaceRegisterDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReserveBasicInfoDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReserveRegisterDto;
import com.app.spotick.domain.dto.user.UserDetailsDto;
import com.app.spotick.global.util.type.PlaceSortType;
import com.app.spotick.service.place.PlaceService;
import com.app.spotick.service.place.reservation.PlaceReservationService;
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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.util.List;

@Slf4j
@Controller
@RequestMapping("/place")
@RequiredArgsConstructor
public class PlaceController {
    private final PlaceService placeService;
    private final PlaceReservationService reservationService;

    @GetMapping
    public String placeList(Model model) {
        // CSR(Client-Side Rendering) 방식으로 전환.
        return "place/list";
    }

    @GetMapping("/{placeId}")
    public String placeDetail(@PathVariable("placeId") Long placeId,
                              @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                              Model model) {
        Long userId = userDetailsDto == null ? null : userDetailsDto.getId();
        PlaceDetailDto place = placeService.findPlaceDetailById(placeId, userId);

        model.addAttribute("place", place);
        return "place/detail";
    }

    @GetMapping("/register")
    public String placeRegister(@ModelAttribute PlaceRegisterDto placeRegisterDto) {
        return "place/register";
    }

    @PostMapping("/register")
    public String placeRegister(@Valid PlaceRegisterDto placeRegisterDto,
                                BindingResult result,
                                @AuthenticationPrincipal UserDetailsDto userDetailsDto) {

        if (result.hasErrors()) {
            return "place/register";
        }

        try {
            placeService.registerPlace(placeRegisterDto, userDetailsDto.getId());
        } catch (IOException e) {
            log.error("Exception [Err_Msg]: {}", e.getMessage());
            return "place/register";
        }

        return "redirect:/place";
    }

    @GetMapping("/check/reserve")
    public String placeReserve(@ModelAttribute PlaceReserveRegisterDto registerDto, Model model) {
        PlaceReserveBasicInfoDto placeReserveDefaultInfo = placeService
                .findPlaceReserveDefaultInfo(registerDto.getPlaceId());

        model.addAttribute("place", placeReserveDefaultInfo);
        return "place/reserve";
    }

    @GetMapping("/edit/{placeId}")
    public String goToPlaceEdit(@PathVariable("placeId") Long placeId,
                                @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                                Model model) {

        PlaceEditDto placeEditDto = placeService.findPlaceInfo(placeId, userDetailsDto.getId()).orElseThrow(
                NoSuchFieldError::new
        );

        model.addAttribute("placeEditDto", placeEditDto);
        return "/place/register";
    }

    @PostMapping("/edit/{placeId}")
    public String placeEdit(@PathVariable("placeId") Long placeId,
                            @Valid @ModelAttribute("placeEditDto") PlaceEditDto placeEditDto,
                            BindingResult result,
                            @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                            RedirectAttributes redirectAttributes) {

        if (result.hasErrors()) {
            for (FieldError error : result.getFieldErrors()) {
                redirectAttributes.addFlashAttribute(error.getField() + "Error", error.getDefaultMessage());
            }
            return "redirect:/place/register/" + placeId;
        }

        if (placeEditDto.getSaveFileIdList().size() +
            (hasFiles(placeEditDto.getPlaceNewFiles()) ? placeEditDto.getPlaceNewFiles().size() : 0) < 5) {
            redirectAttributes.addFlashAttribute("fileError", "파일은 총 5개 이상이어야 합니다.");
            return "redirect:/place/register/" + placeId;
        }


        try {
            placeService.updatePlace(placeEditDto, userDetailsDto.getId());
        } catch (IOException e) {
            log.error("Exception [Err_Msg]: {}", e.getMessage());
            return "redirect:/place/register/" + placeId;
        }

        return "redirect:/mypage/places";
    }

    private boolean hasFiles(List<MultipartFile> files) {
        return files != null && files.stream().anyMatch(file -> file.getSize() > 0);
    }
}










