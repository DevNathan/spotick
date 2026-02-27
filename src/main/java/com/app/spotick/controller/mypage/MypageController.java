package com.app.spotick.controller.mypage;

import com.app.spotick.domain.dto.page.TicketPage;
import com.app.spotick.domain.dto.place.PlaceListDto;
import com.app.spotick.domain.dto.place.PlaceManageListDto;
import com.app.spotick.domain.dto.place.PlaceReservationListDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReservedNotReviewedDto;
import com.app.spotick.domain.dto.place.review.ContractedPlaceDto;
import com.app.spotick.domain.dto.place.review.PlaceReviewRegisterDto;
import com.app.spotick.domain.dto.place.review.MypageReviewListDto;
import com.app.spotick.domain.dto.ticket.TicketInfoDto;
import com.app.spotick.domain.dto.ticket.TicketManageListDto;
import com.app.spotick.domain.dto.user.UserDetailsDto;
import com.app.spotick.domain.dto.user.UserProfileDto;
import com.app.spotick.domain.pagination.Pagination;
import com.app.spotick.domain.type.ticket.TicketRequestType;
import com.app.spotick.global.util.type.PlaceManagerSortType;
import com.app.spotick.global.util.type.PlaceReservationSortType;
import com.app.spotick.global.util.type.PlaceSortType;
import com.app.spotick.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.util.NoSuchElementException;

@Controller
@RequestMapping("/mypage")
@RequiredArgsConstructor
public class MypageController {
    private final UserService userService;

    /* ================================================유저정보수정=================================================== */
    @GetMapping("/user-info")
    public void goToUserInfo(Model model, @AuthenticationPrincipal UserDetailsDto userDetailsDto) {
        // 가려진 이메일 정보
        String maskedEmail = getMaskedEmail(userDetailsDto.getEmail());
        model.addAttribute("maskedEmail", maskedEmail);
        // 유저 프로필 정보
        UserProfileDto userProfileDto = userService.getUserProfile(userDetailsDto.getId());

        model.addAttribute("userProfile", userProfileDto);
    }

    /* =================================================북마크====================================================== */
    @GetMapping("/bookmarks")
    public void goToBookmarks(@RequestParam(value = "page", defaultValue = "1") int page,
                              @RequestParam(value = "sort", defaultValue = "POPULARITY") PlaceSortType sortType,
                              @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                              Model model) {
        Pageable pageable = PageRequest.of(page - 1, 6);

        Page<PlaceListDto> bookmarkedPlaces = userService.findBookmarkedPlacesByUserId(userDetailsDto.getId(), pageable, sortType);
        Pagination<PlaceListDto> pagination = new Pagination<>(5, pageable, bookmarkedPlaces);

        model.addAttribute("placeDtoList", bookmarkedPlaces);
        model.addAttribute("sort", sortType);
        model.addAttribute("pagination", pagination);
    }

    /* =================================================예약내역====================================================== */
    @GetMapping("/reservations")
    public void goToReservations(@RequestParam(value = "page", defaultValue = "1") int page,
                                 @RequestParam(value = "sort", defaultValue = "UPCOMING") PlaceReservationSortType sortType,
                                 @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                                 Model model) {
        Pageable pageable = PageRequest.of(page - 1, 6);

        Page<PlaceReservationListDto> reservations = userService.findReservationsByUserId(userDetailsDto.getId(), pageable, sortType);
        Pagination<PlaceReservationListDto> pagination = new Pagination<>(5, pageable, reservations);

        model.addAttribute("reservationDtoList", reservations);
        model.addAttribute("sort", sortType);
        model.addAttribute("pagination", pagination);
    }
    /* =================================================문의내역====================================================== */
    @GetMapping("/inquiries")
    public void goToInquiries() {
    }

    /* =================================================리뷰내역====================================================== */
    @GetMapping("/reviews")
    public RedirectView goToReviews() {
        return new RedirectView("/mypage/reviews/reviewable");
    }

    @GetMapping("/reviews/reviewable")
    public void goToReviewsReviewable(@ModelAttribute("reviewRegisterDto") PlaceReviewRegisterDto placeReviewRegisterDto,
                                      @RequestParam(value = "page", defaultValue = "1") int page,
                                      @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                                      Model model) {

        Pageable pageable = PageRequest.of(page - 1, 6);

        Page<PlaceReservedNotReviewedDto> notReviewedList
                = userService.findPlacesNotReviewed(userDetailsDto.getId(), pageable);
        Pagination<PlaceReservedNotReviewedDto> pagination
                = new Pagination<>(5, pageable, notReviewedList);

        model.addAttribute("notReviewedList", notReviewedList);
        model.addAttribute("pagination", pagination);
    }

    @GetMapping("/reviews/wrote")
    public void goToReviewsWrote(@RequestParam(value = "page", defaultValue = "1") int page,
                                 @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                                 Model model) {
        Pageable pageable = PageRequest.of(page - 1, 5);

        Page<MypageReviewListDto> reviewedList
                = userService.findReviewedList(userDetailsDto.getId(), pageable);
        Pagination<MypageReviewListDto> pagination
                = new Pagination<>(5, pageable, reviewedList);

        model.addAttribute("reviewedList", reviewedList);
        model.addAttribute("pagination", pagination);
    }

    /* =================================================장소관리====================================================== */
    @GetMapping("/places")
    public void goToPlaces(@RequestParam(value = "page", defaultValue = "1") int page,
                           @RequestParam(value = "sort", defaultValue = "RESERVATION") PlaceManagerSortType sortType,
                           @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                           Model model) {
        Pageable pageable = PageRequest.of(page - 1, 6);

        Page<PlaceManageListDto> hostPlacesPage
                = userService.findHostPlacesPage(userDetailsDto.getId(), pageable, sortType);
        Pagination<PlaceManageListDto> pagination
                = new Pagination<>(5, pageable, hostPlacesPage);

        model.addAttribute("hostPlacesPage", hostPlacesPage);
        model.addAttribute("sort", sortType);
        model.addAttribute("pagination", pagination);
    }

    @GetMapping("/places/inquiries/{placeId}")
    public String goToPlacesInquiryList(@PathVariable("placeId") Long placeId,
                                        @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                                        Model model) {

        ContractedPlaceDto placeDto = userService.findPlaceBriefly(placeId, userDetailsDto.getId()).orElseThrow(
                NoSuchElementException::new
        );

        model.addAttribute("placeDto", placeDto);

        return "/mypage/places/inquiries";
    }

    @GetMapping("/places/reservations/{placeId}")
    public String goToPlacesReservationList(@PathVariable("placeId") Long placeId,
                                            @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                                            Model model) {

        ContractedPlaceDto placeDto = userService.findPlaceBriefly(placeId, userDetailsDto.getId()).orElseThrow(
                NoSuchElementException::new
        );

        model.addAttribute("placeDto", placeDto);

        return "/mypage/places/reservations";
    }

    /* =================================================티켓관리====================================================== */
    @GetMapping("/tickets")
    public void goToTickets(@RequestParam(value = "page", defaultValue = "1") int page,
                            @RequestParam(value = "view", defaultValue = "all") String viewType,
                            @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                            Model model) {
        Pageable pageable = PageRequest.of(page - 1, 5);

        TicketRequestType ticketRequestType = TicketRequestType.valueOf(viewType);

        TicketPage ticketPage
                = userService.findHostTicketsPage(userDetailsDto.getId(), pageable, ticketRequestType);
        Pagination<TicketManageListDto> pagination
                = new Pagination<>(5, pageable, ticketPage.getPage());


        model.addAttribute("ticketPage", ticketPage);
        model.addAttribute("pagination", pagination);
        model.addAttribute("viewType", viewType);
    }

    @GetMapping("/tickets/inquiries/{ticketId}")
    public String goToTicketsInquiryList(@PathVariable("ticketId") Long ticketId,
                                         @AuthenticationPrincipal UserDetailsDto userDetailsDto,
                                         Model model) {

        TicketInfoDto ticketInfo = userService.findTicketInfo(ticketId, userDetailsDto.getId()).orElseThrow(
                NoSuchElementException::new
        );

        model.addAttribute("ticketInfo", ticketInfo);

        return "/mypage/tickets/inquiries";
    }

    private String getMaskedEmail(String email) {
        // 이메일 주소의 처음 4글자와 마지막 @ 이전 부분을 유지하고 나머지를 *로 마스킹
        return email.substring(0, 4) + "****@" + email.substring(email.indexOf('@') + 1);
    }
}
