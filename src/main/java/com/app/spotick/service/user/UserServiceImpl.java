package com.app.spotick.service.user;

import com.app.spotick.api.dto.user.UserFindEmailDto;
import com.app.spotick.api.dto.user.UserStatusDto;
import com.app.spotick.domain.dto.page.TicketPage;
import com.app.spotick.domain.dto.place.PlaceListDto;
import com.app.spotick.domain.dto.place.PlaceManageListDto;
import com.app.spotick.domain.dto.place.PlaceReservationListDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReservedNotReviewedDto;
import com.app.spotick.domain.dto.place.review.ContractedPlaceDto;
import com.app.spotick.domain.dto.place.review.MypageReviewListDto;
import com.app.spotick.domain.dto.ticket.TicketInfoDto;
import com.app.spotick.domain.dto.user.UserDetailsDto;
import com.app.spotick.domain.dto.user.UserJoinDto;
import com.app.spotick.domain.dto.user.UserProfileDto;
import com.app.spotick.domain.entity.user.User;
import com.app.spotick.domain.entity.user.UserAuthority;
import com.app.spotick.domain.entity.user.UserProfileFile;
import com.app.spotick.domain.type.ticket.TicketRequestType;
import com.app.spotick.domain.type.user.AuthorityType;
import com.app.spotick.domain.type.user.UserStatus;
import com.app.spotick.global.util.type.PlaceManagerSortType;
import com.app.spotick.global.util.type.PlaceReservationSortType;
import com.app.spotick.global.util.type.PlaceSortType;
import com.app.spotick.repository.place.PlaceRepository;
import com.app.spotick.repository.place.Review.PlaceReviewRepository;
import com.app.spotick.repository.place.bookmark.PlaceBookmarkRepository;
import com.app.spotick.repository.place.reservation.PlaceReservationRepository;
import com.app.spotick.repository.ticket.TicketRepository;
import com.app.spotick.repository.user.UserAuthorityRepository;
import com.app.spotick.repository.user.UserRepository;
import com.app.spotick.service.redis.RedisService;
import com.app.spotick.service.util.MailService;
import lombok.RequiredArgsConstructor;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.MailSendException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Random;

@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService, UserDetailsService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final UserAuthorityRepository authorityRepository;
    private final UserProfileFileService profileFileService;
    private final PlaceRepository placeRepository;
    private final PlaceBookmarkRepository placeBookmarkRepository;
    private final PlaceReservationRepository placeReservationRepository;
    private final PlaceReviewRepository placeReviewRepository;
    private final TicketRepository ticketRepository;
    private final RedisService redisService;
    private final MailService mailService;

    @Override
    public void join(UserJoinDto userJoinDto) {
        userJoinDto.setPassword(encodePassword(userJoinDto.getPassword()));
//        랜덤 사진 추가
        UserProfileFile userProfileFile = profileFileService.saveDefaultRandomImgByUser();

        User savedUser = userRepository.save(userJoinDto.toEntity(userProfileFile));
        userJoinDto.setId(savedUser.getId());
//      권한 추가
        authorityRepository.save(UserAuthority.builder()
                .authorityType(AuthorityType.ROLE_USER)
                .user(savedUser)
                .build());
    }

    @Override
    public void join(UserJoinDto userJoinDto, UserProfileFile userProfileFile) {
        userJoinDto.setPassword(encodePassword(userJoinDto.getPassword()));

        User savedUser = userRepository.save(userJoinDto.toEntity(userProfileFile));
        userJoinDto.setId(savedUser.getId());

        authorityRepository.save(UserAuthority.builder()
                .authorityType(AuthorityType.ROLE_USER)
                .user(savedUser)
                .build());
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User foundUser = userRepository.findUserAndProfileByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("해당 이메일로 등록된 회원 없음"));

        if (foundUser.getUserStatus().isTemporarilySuspended()) {
            LocalDate now = LocalDate.now();
            if (now.isAfter(foundUser.getSuspensionEndDate()) || now.isEqual(foundUser.getSuspensionEndDate())) {
                foundUser.updateSuspensionEndDate(null);
                foundUser.updateUserStatus(UserStatus.ACTIVATE);
            }
        }
        return new UserDetailsDto(foundUser, authorityRepository.findUserAuthorityByUser(foundUser));
    }

    @Override
    public UserProfileDto getUserProfile(Long userId) {
        return userRepository.findUserProfileById(userId)
                .orElseThrow(() -> new NoSuchElementException("유저 프로필을 찾을 수 없음: " + userId));
    }

    @Override
    public void updateNickName(Long userId, String newNickName) {
        User foundUser = userRepository.findById(userId).orElseThrow(
                NoSuchElementException::new
        );

        foundUser.updateNickName(newNickName);
    }

    // 전화번호 SMS 인증 <- SMS API는 coolsms로 선택함.
    @Override
    public void sendAuthCodeToTel(String tel) {
        String code = createKey();

        System.out.println("tel = " + tel);
        System.out.println("code = " + code);

        DefaultMessageService messageService = NurigoApp.INSTANCE.initialize("NCS25SRQDFKRGDMH", "MKL9HRNYWZ2FPCYDRRPHBAOU9MMYBRHG", "https://api.coolsms.co.kr");

        Message message = new Message();
        message.setFrom("01011111111");
        message.setTo(tel);
        message.setText("인증번호는 " + code + "입니다. 1분 이내로 인증해주세요.");

//        해당부분은 실행되면 돈나가므로 주석처리함. 인증코드 확인은 서버콘솔창 확인하거나 redis콘솔창 확인하여 사용할 것.
//        try {
//            messageService.send(message);
//        } catch (NurigoMessageNotReceivedException exception) {
//            // 발송에 실패한 메시지 목록을 확인할 수 있습니다!
//            System.out.println(exception.getFailedMessageList());
//            System.out.println(exception.getMessage());
//        } catch (Exception exception) {
//            System.out.println(exception.getMessage());
//        }

//        redis 키: 전화번호 / 밸류: 인증코드 / 지속시간 1분 설정
        redisService.setValues(tel, code, Duration.ofMinutes(1));
    }

    @Override
    public void updateTel(Long userId, String newTel) {
        User foundUser = userRepository.findById(userId).orElseThrow(
                NoSuchElementException::new
        );

        foundUser.updateTel(newTel);
    }

    @Override
    public void updatePassword(Long userId, String newPassword) {
        User foundUser = userRepository.findById(userId).orElseThrow(
                NoSuchElementException::new
        );
        foundUser.updatePassword(encodePassword(newPassword));
    }

    @Override
    public void updatePassword(String email, String newPassword) {
        User foundUser = userRepository.findUserByEmail(email).orElseThrow(
                NoSuchElementException::new
        );
        foundUser.updatePassword(encodePassword(newPassword));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PlaceListDto> findBookmarkedPlacesByUserId(Long userId, Pageable pageable, PlaceSortType sortType) {
        return placeBookmarkRepository.findBookmarkedPlacesByUserId(userId, pageable, sortType);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PlaceReservationListDto> findReservationsByUserId(Long userId, Pageable pageable, PlaceReservationSortType sortType) {
        return placeReservationRepository.findReservationsByUserId(userId, pageable, sortType);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PlaceReservedNotReviewedDto> findPlacesNotReviewed(Long userId, Pageable pageable) {
        return placeRepository.findPlaceListNotRelatedToReview(userId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MypageReviewListDto> findReviewedList(Long userId, Pageable pageable) {
        return placeReviewRepository.findReviewsByUserId(userId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PlaceManageListDto> findHostPlacesPage(Long userId, Pageable pageable, PlaceManagerSortType sortType) {
        return placeRepository.findHostPlaceListByUserId(userId, pageable, sortType);
    }

    @Override
    public Optional<ContractedPlaceDto> findPlaceBriefly(Long placeId, Long userId) {
        return placeRepository.findPlaceBriefly(placeId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketPage findHostTicketsPage(Long userId, Pageable pageable, TicketRequestType ticketRequestType) {
        return ticketRepository.findHostTicketListByUserId(userId, pageable, ticketRequestType);
    }

    @Override
    public Optional<TicketInfoDto> findTicketInfo(Long ticketId, Long userId) {
        return ticketRepository.findTicketInfoByTicketId(ticketId, userId);
    }

    private String encodePassword(String password) {
        return passwordEncoder.encode(password);
    }

    //    인증코드 제조기(6자리 숫자)
    public static String createKey() {
        StringBuilder key = new StringBuilder();
        Random rnd = new Random();

        for (int i = 0; i < 6; i++) { // 인증코드 6자리
            key.append((rnd.nextInt(10)));
        }
        return key.toString();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isExistsEmail(String email) {
        return userRepository.existsUserByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isValidNickname(String nickname) {
        return !userRepository.existsUserByNickName(nickname);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkUserByNicknameAndTel(String nickname, String tel) {
        return userRepository.existsUserByNickNameAndTel(nickname, tel);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isValidCertCode(String certCode, String key) {
        return certCode.equals(redisService.getValues(key));
    }

    @Override
    @Transactional(readOnly = true)
    public UserFindEmailDto.Response findUserFindEmailDto(String nickname, String tel) {
        UserFindEmailDto.Response response = userRepository.findEmailDtoByNickNameAndTel(nickname, tel)
                .orElseThrow(() -> new IllegalStateException("잘못된 닉네임, 전화번호"));
        String registerDateFormat = response.getCreatedDate().format(DateTimeFormatter.ofPattern("yyyy년 MM월 dd일"));
        response.setCreatedDateStr(registerDateFormat);
        return response;
    }

    @Override
    public void sendCodeToEmail(String toEmail) throws MailSendException {
        String title = "Spotick 이메일 인증 번호";
        String certCode = createKey();
        mailService.sendEmail(toEmail, title, certCode);
        redisService.setValues(toEmail, certCode, Duration.ofMinutes(5));
    }

    @Override
    public void updateUserStatus(UserStatusDto userStatusDto) {
        User user = userRepository.findById(userStatusDto.getUserId())
                .orElseThrow(() -> new IllegalStateException("존재하지 않는 회원 ID"));

        LocalDate suspensionEndDate = switch (userStatusDto.getStatus()) {
            case SUSPENDED_7_DAYS -> LocalDate.now().plusDays(7);
            case SUSPENDED_30_DAYS -> LocalDate.now().plusDays(30);
            default -> null;
        };

        user.updateSuspensionEndDate(suspensionEndDate);
        user.updateUserStatus(userStatusDto.getStatus());
    }
}









