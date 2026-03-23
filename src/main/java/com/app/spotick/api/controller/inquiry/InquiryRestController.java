package com.app.spotick.api.controller.inquiry;

import com.app.spotick.api.dto.place.InquiryResponseDto;
import com.app.spotick.api.response.DataResponse;
import com.app.spotick.api.response.MessageResponse;
import com.app.spotick.api.response.PageResponse;
import com.app.spotick.domain.dto.place.PlaceInquiryListDto;
import com.app.spotick.domain.dto.place.inquiry.UnansweredInquiryDto;
import com.app.spotick.domain.dto.ticket.TicketInquiryListDto;
import com.app.spotick.domain.dto.user.UserDetailsDto;
import com.app.spotick.domain.pagination.Pagination;
import com.app.spotick.service.place.inquiry.PlaceInquiryService;
import com.app.spotick.service.ticket.inquiry.TicketInquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/inquiries/api")
@RequiredArgsConstructor
@Slf4j
public class InquiryRestController {
    private final PlaceInquiryService placeInquiryService;
    private final TicketInquiryService ticketInquiryService;

    @GetMapping("/places")
    public ResponseEntity<PageResponse<PlaceInquiryListDto>> getPlaceInquiries(@RequestParam(value = "page", defaultValue = "1") int page,
                                                                               @AuthenticationPrincipal UserDetailsDto userDetailsDto) {

        try {
            Pageable pageable = PageRequest.of(page - 1, 10);

            Page<PlaceInquiryListDto> placeInquiryDtos = placeInquiryService.getInquiriesByUserId(userDetailsDto.getId(), pageable);
            Pagination<PlaceInquiryListDto> pagination = new Pagination<>(5, pageable, placeInquiryDtos);

            PageResponse<PlaceInquiryListDto> response = new PageResponse<>(placeInquiryDtos, pagination);

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("유저 장소문의 내역 [Err_Msg]: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/tickets")
    public ResponseEntity<PageResponse<TicketInquiryListDto>> getTicketInquiries(@RequestParam(value = "page", defaultValue = "1") int page,
                                                                                 @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        try {
            Pageable pageable = PageRequest.of(page - 1, 10);

            Page<TicketInquiryListDto> ticketInquiryDtos = ticketInquiryService.findInquiriesPage(userDetailsDto.getId(), pageable);
            Pagination<TicketInquiryListDto> pagination = new Pagination<>(5, pageable, ticketInquiryDtos);

            PageResponse<TicketInquiryListDto> response = new PageResponse<>(ticketInquiryDtos, pagination);

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("유저 티켓문의 내역 [Err_Msg]: {}", e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/placeDelete/{placeInquiryId}")
    public ResponseEntity<DataResponse<?>> deletePlaceInquiry(@PathVariable("placeInquiryId") Long placeInquiryId,
                                                              @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        try {
            placeInquiryService.deleteInquiryById(placeInquiryId, userDetailsDto.getId());

            return new ResponseEntity<>(DataResponse.builder()
                    .success(true)
                    .data(placeInquiryId)
                    .message("문의 내역을 삭제했습니다.")
                    .build(), HttpStatus.OK);
        } catch (Exception e) {
            log.error("장소 문의 삭제 [Err_Msg]: {}", e.getMessage());
            return new ResponseEntity<>(DataResponse.builder()
                    .success(false)
                    .message("문의 내역을 삭제에 실패했습니다.")
                    .build(), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/ticketDelete/{ticketInquiryId}")
    public ResponseEntity<DataResponse<?>> deleteTicketInquiry(@PathVariable("ticketInquiryId") Long ticketInquiryId,
                                                               @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        try {
            ticketInquiryService.deleteInquiry(ticketInquiryId, userDetailsDto.getId());

            return new ResponseEntity<>(DataResponse.builder()
                    .success(true)
                    .data(ticketInquiryId)
                    .message("문의 내역을 삭제했습니다.")
                    .build(), HttpStatus.OK);
        } catch (Exception e) {
            log.error("티켓 문의 삭제 [Err_Msg]: {}", e.getMessage());
            return new ResponseEntity<>(DataResponse.builder()
                    .success(false)
                    .message("문의 내역을 삭제에 실패했습니다.")
                    .build(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/getPlace/{placeId}")
    public ResponseEntity<Slice<UnansweredInquiryDto>> getUnansweredInquiriesOfPlace(@PathVariable("placeId") Long placeId,
                                                                                     @RequestParam(name = "page", defaultValue = "0") int page,
                                                                                     @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        Pageable pageable = PageRequest.of(page, 10);

        Slice<UnansweredInquiryDto> contentsSlice = placeInquiryService.findUnanswerdInquiriesSlice(placeId, userDetailsDto.getId(), pageable);

        System.out.println("contentsSlice = " + contentsSlice.getContent());

        return ResponseEntity.ok(contentsSlice);
    }

    @GetMapping("/getTicket/{ticketId}")
    public ResponseEntity<Slice<UnansweredInquiryDto>> getUnansweredInquiriesOfTicket(@PathVariable("ticketId") Long ticketId,
                                                                                      @RequestParam(name = "page", defaultValue = "0") int page,
                                                                                      @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        Pageable pageable = PageRequest.of(page, 10);

        Slice<UnansweredInquiryDto> contentsSlice = ticketInquiryService.findUnanswerdInquiriesSlice(ticketId, userDetailsDto.getId(), pageable);

        return ResponseEntity.ok(contentsSlice);
    }

    @PatchMapping("/response-plin")
    public ResponseEntity<MessageResponse> updatePlaceResponse(@Valid @RequestBody InquiryResponseDto inquiryResponseDto,
                                                               BindingResult result) {
        if (result.hasErrors()) {
            List<FieldError> errors = result.getFieldErrors();

            FieldError firstError = errors.get(0);
            String errorMessage = firstError.getDefaultMessage();

            return new ResponseEntity<>(MessageResponse.builder()
                    .success(false)
                    .message(errorMessage)
                    .build(), HttpStatus.BAD_REQUEST
            );
        }

        try {
            placeInquiryService.updateInquiryResponse(inquiryResponseDto);

            return new ResponseEntity<>(MessageResponse.builder()
                    .success(true)
                    .message("답변이 작성되었습니다.")
                    .build(), HttpStatus.OK
            );
        } catch (Exception e) {
            log.error("장소 문의 답변 [Err_Msg]: {}", e.getMessage());
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build(), HttpStatus.BAD_REQUEST
            );
        }
    }

    @PatchMapping("/response-tiin")
    public ResponseEntity<MessageResponse> updateTicketResponse(@Valid @RequestBody InquiryResponseDto inquiryResponseDto,
                                                                BindingResult result) {
        if (result.hasErrors()) {
            List<FieldError> errors = result.getFieldErrors();

            FieldError firstError = errors.get(0);
            String errorMessage = firstError.getDefaultMessage();

            return new ResponseEntity<>(MessageResponse.builder()
                    .success(false)
                    .message(errorMessage)
                    .build(), HttpStatus.BAD_REQUEST
            );
        }

        try {
            ticketInquiryService.updateInquiryResponse(inquiryResponseDto);
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(true)
                    .message("답변이 작성되었습니다.")
                    .build(), HttpStatus.OK
            );
        } catch (NoSuchElementException e) {
            log.error("티켓 문의 답변 [Err_Msg]: {}", e.getMessage());
            return new ResponseEntity<>(MessageResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build(), HttpStatus.BAD_REQUEST
            );
        }
    }
}
