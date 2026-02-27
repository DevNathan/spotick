package com.app.spotick.service.user;

import com.app.spotick.api.dto.user.UserStatusDto;
import com.app.spotick.domain.dto.page.TicketPage;
import com.app.spotick.api.dto.user.UserFindEmailDto;
import com.app.spotick.domain.dto.place.PlaceListDto;
import com.app.spotick.domain.dto.place.PlaceManageListDto;
import com.app.spotick.domain.dto.place.PlaceReservationListDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReservedNotReviewedDto;
import com.app.spotick.domain.dto.place.review.ContractedPlaceDto;
import com.app.spotick.domain.dto.place.review.MypageReviewListDto;
import com.app.spotick.domain.dto.ticket.TicketInfoDto;
import com.app.spotick.domain.dto.user.UserJoinDto;
import com.app.spotick.domain.dto.user.UserProfileDto;
import com.app.spotick.domain.entity.user.UserProfileFile;
import com.app.spotick.domain.type.ticket.TicketRequestType;
import com.app.spotick.global.util.type.PlaceManagerSortType;
import com.app.spotick.global.util.type.PlaceReservationSortType;
import com.app.spotick.global.util.type.PlaceSortType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.net.ConnectException;
import java.util.Optional;

public interface UserService {
//    일반 회원 등록
    void join(UserJoinDto userJoinDto);

//    oauth2연결로 프로필사진이 있는 경우 회원 등록
    void join(UserJoinDto userJoinDto, UserProfileFile userProfileFile);

    UserProfileDto getUserProfile(Long userId);

    void updateNickName(Long userId, String newNickName);

    void sendAuthCodeToTel(String tel);

    void updateTel(Long userId, String newTel);

    void updatePassword(Long userId, String newPassword);
    void updatePassword(String email, String newPassword);

    Page<PlaceListDto> findBookmarkedPlacesByUserId(Long userId, Pageable pageable, PlaceSortType sortType);

    Page<PlaceReservationListDto> findReservationsByUserId(Long userId, Pageable pageable, PlaceReservationSortType sortType);

    Page<PlaceReservedNotReviewedDto> findPlacesNotReviewed(Long userId, Pageable pageable);

    Page<MypageReviewListDto> findReviewedList(Long userId, Pageable pageable);

    Page<PlaceManageListDto> findHostPlacesPage(Long userId, Pageable pageable, PlaceManagerSortType sortType);

    Optional<ContractedPlaceDto> findPlaceBriefly(Long placeId, Long userId);

    TicketPage findHostTicketsPage(Long userId, Pageable pageable, TicketRequestType ticketRequestType);

    Optional<TicketInfoDto> findTicketInfo(Long ticketId, Long userId);

    boolean isExistsEmail(String email);
    boolean isValidNickname(String nickname);
    boolean checkUserByNicknameAndTel(String nickname, String tel);
    boolean isValidCertCode(String certCode, String key);
    UserFindEmailDto.Response findUserFindEmailDto(String nickname,String tel);

    void sendCodeToEmail(String toEmail) throws ConnectException;

    void updateUserStatus(UserStatusDto userStatusDto);
}
