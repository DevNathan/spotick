package com.app.spotick.api.controller.ticket;

import com.app.spotick.api.response.DataResponse;
import com.app.spotick.domain.dto.ticket.TicketListDto;
import com.app.spotick.domain.dto.ticket.grade.TicketGradeSaleInfoDto;
import com.app.spotick.domain.dto.user.UserDetailsDto;
import com.app.spotick.domain.type.ticket.TicketCategory;
import com.app.spotick.domain.type.ticket.TicketRatingType;
import com.app.spotick.global.util.search.DistrictFilter;
import com.app.spotick.global.util.type.TicketSortType;
import com.app.spotick.service.ticket.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/ticket/api")
@RequiredArgsConstructor
public class TicketRestController {
    private final TicketService ticketService;

    @GetMapping("/list")
    public ResponseEntity<Slice<TicketListDto>> ticketList(@RequestParam("page") int page,
                                                           @RequestParam(value = "category", required = false) TicketCategory category,
                                                           @RequestParam(value = "ratingType", required = false) TicketRatingType ratingType,
                                                           @RequestParam("sortType") TicketSortType sortType,
                                                           @RequestParam(value = "district", required = false) String district,
                                                           @RequestParam(value = "detailDistrict", required = false) List<String> detailDistrict,
                                                           @RequestParam(value = "keyword", required = false) String keyword,
                                                           @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        Pageable pageable = PageRequest.of(page, 12);
        Long userId = userDetailsDto == null ? null : userDetailsDto.getId();

        DistrictFilter districtFilter = new DistrictFilter(district, detailDistrict);

        Slice<TicketListDto> ticketList = ticketService.findTicketListPage(pageable, category, ratingType, sortType, districtFilter, userId, keyword);

        return ResponseEntity.ok(ticketList);
    }

    @GetMapping("/getGrades")
    public ResponseEntity<DataResponse<List<TicketGradeSaleInfoDto>>> getTicketGrades(@RequestParam("ticketId") Long ticketId,
                                                                                      @RequestParam("date") @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date) {
        List<TicketGradeSaleInfoDto> ticketGrades;
        try {
            ticketGrades = ticketService.findTicketGrades(ticketId, date);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        return ResponseEntity.ok(new DataResponse<>(true, "조회 성공", ticketGrades));
    }
}