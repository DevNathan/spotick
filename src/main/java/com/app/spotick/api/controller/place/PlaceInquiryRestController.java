package com.app.spotick.api.controller.place;

import com.app.spotick.api.dto.place.InquiryResponseDto;
import com.app.spotick.api.dto.place.PlaceInquiryDto;
import com.app.spotick.domain.dto.user.UserDetailsDto;
import com.app.spotick.domain.pagination.Pagination;
import com.app.spotick.service.place.inquiry.PlaceInquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/places/inquiry")
@RequiredArgsConstructor
public class PlaceInquiryRestController {
    private final PlaceInquiryService inquiryService;
    @PostMapping("/v1/register")
    public ResponseEntity<PlaceInquiryDto.Response> inquiryRegister(@AuthenticationPrincipal UserDetailsDto userDetailsDto,
                                          @RequestBody PlaceInquiryDto.Request inquiryDto){
        PlaceInquiryDto.Response inquiryDtoResp = inquiryService.register(inquiryDto, userDetailsDto.getId());
        return ResponseEntity.ok()
                .body(inquiryDtoResp);
    }

    @GetMapping("/v1/{placeId}/list")
    public ResponseEntity<Map<String, Object>> inquiryList(@PathVariable("placeId") Long placeId,
                            @PageableDefault(page =1,
                                    size = 10,sort = "id",
                                    direction = Sort.Direction.DESC
                            )Pageable pageable){

        PageRequest pageRequest = PageRequest.of(pageable.getPageNumber()-1, 5, pageable.getSort());
        Page<PlaceInquiryDto.Response> inquiryPage = inquiryService.inquiryListWithPage(placeId, pageRequest);

        Pagination<PlaceInquiryDto.Response> pageBlock = new Pagination<>(5,pageRequest,inquiryPage);

        return ResponseEntity.ok()
                .body(Map.of("inquiryPage", inquiryPage,"pageBlock", pageBlock));
    }

    @PatchMapping("/response")
    public ResponseEntity<String> updateResponse(@Valid @RequestBody InquiryResponseDto inquiryResponseDto,
                                                 BindingResult result) {
        if (result.hasErrors()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("답변을 제대로 입력해주세요.");
        }

        try {
            inquiryService.updateInquiryResponse(inquiryResponseDto);
        } catch (NoSuchElementException e) {

            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("오류가 발생했습니다.<br>다시 시도해주세요.");
        }

        return ResponseEntity.status(HttpStatus.OK)
                .body("답변이 작성되었습니다.");
    }




}
