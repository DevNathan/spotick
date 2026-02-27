package com.app.spotick.domain.dto.user;

import com.app.spotick.domain.entity.user.User;
import com.app.spotick.domain.entity.user.UserAuthority;
import com.app.spotick.domain.entity.user.UserProfileFile;
import com.app.spotick.domain.type.user.UserStatus;
import com.app.spotick.global.security.type.OAuthType;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@NoArgsConstructor
@Data
public class UserDetailsDto implements UserDetails, OAuth2User {
    private Long id;
    private String email;
    private String password;
    private String nickName;
    private String tel;
    private UserStatus userStatus;
    private List<String> userAuthorities;
    private Long profileId;
    private String profileFileName;
    private String profileUUID;
    private String profileUploadPath;
    private boolean isDefaultImage;
//    ----------⬇️ oauth로그인 필드 ------------------
//    해당 필드들이 null이면 일반 로그인 사용자
//    존재하면 oauth로그인 사용자
    private OAuthType oAuthType;
    private Map<String, Object> attributes;
    
//    일반 로그인 생성자
    public UserDetailsDto(User user, List<UserAuthority> userAuthorities) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.nickName = user.getNickName();
        this.tel = user.getTel();
        this.userStatus = user.getUserStatus();
        this.userAuthorities = userAuthorities.stream()
                .map(auth -> auth.getAuthorityType().name())
                .toList();
        UserProfileFile userProfileFile = user.getUserProfileFile();
        this.profileId = userProfileFile.getId();
        this.profileFileName = userProfileFile.getFileName();
        this.profileUUID = userProfileFile.getUuid();
        this.profileUploadPath = userProfileFile.getUploadPath();
        this.isDefaultImage = userProfileFile.isDefaultImage();
    }

//    OAuth2 로그인용 생성자
    public UserDetailsDto(User user, List<UserAuthority> userAuthorities,Map<String,Object> attributes, OAuthType oAuthType) {
        this(user,userAuthorities);
        this.attributes = attributes;
        this.oAuthType = oAuthType;
    }

    public void updateProfileImage(String fileName, String uuid, String profileUploadPath, boolean isDefaultImage) {
        this.profileFileName = fileName;
        this.profileUUID = uuid;
        this.profileUploadPath = profileUploadPath;
        this.isDefaultImage = isDefaultImage;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Collection<GrantedAuthority> grantedAuthorities = new ArrayList<>();

        userAuthorities.forEach(auth -> grantedAuthorities.add(
                (GrantedAuthority) () -> auth)
        );

        return grantedAuthorities;
    }

    @Override
    public String getUsername() {
        return email;
    }

    // 계정이 만료되지 않았는지
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // 계정이 잠긴건 아닌지?
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    // 계정 credential 이 만료된건 아닌지?
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return userStatus == UserStatus.ACTIVATE;
    }

    public void updateNickName(String nickName) {
        this.nickName = nickName;
    }

//    ==================================
//    OAuth2User 구현 메소드
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public String getName() {
        return email;
    }
}
