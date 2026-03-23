package com.app.spotick.api.controller.ticket;

import com.app.spotick.api.response.PageResponse;
import com.app.spotick.api.dto.ticket.TicketInquiryDto;
import com.app.spotick.domain.dto.user.UserDetailsDto;
import com.app.spotick.domain.pagination.Pagination;
import com.app.spotick.service.ticket.inquiry.TicketInquiryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tickets/api/inquiry")
@RequiredArgsConstructor
@Slf4j
public class TicketInquiryRestController {
    private final TicketInquiryService ticketInquiryService;

    @PostMapping("/register")
    public ResponseEntity<Void> inquiryRegister(@RequestBody TicketInquiryDto.Request inquiryReq,
                                                                     @AuthenticationPrincipal UserDetailsDto userDetailsDto) {

        try {
            ticketInquiryService.register(inquiryReq, userDetailsDto.getId());

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Exception [오류]: {}", e.getMessage());

            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{ticketId}/list")
    public ResponseEntity<PageResponse<TicketInquiryDto.Response>> getInquiryList(@PathVariable("ticketId") Long ticketId,
                                                                                  @RequestParam("page") int page) {
        Pageable pageable = PageRequest.of(page, 5);

        Page<TicketInquiryDto.Response> contents = ticketInquiryService.findInquiryListPageById(ticketId, pageable);

        Pagination<TicketInquiryDto.Response> pagination = new Pagination<>(5, pageable, contents);

        PageResponse<TicketInquiryDto.Response> response = new PageResponse<>(contents, pagination);

        return ResponseEntity.ok()
                .body(response);
    }

}
