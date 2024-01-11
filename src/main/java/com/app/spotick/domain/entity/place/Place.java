package com.app.spotick.domain.entity.place;

import com.app.spotick.domain.base.post.PostBase;
import com.app.spotick.domain.embedded.post.PostAddress;
import com.app.spotick.domain.entity.user.User;
import com.app.spotick.domain.type.place.PlaceStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "TBL_PLACE")
@SequenceGenerator(name = "SEQ_PLACE_GENERATOR", sequenceName = "SEQ_PLACE",allocationSize = 1)
@Getter @ToString(callSuper = true) @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Place extends PostBase {
    @Id @GeneratedValue(generator = "SEQ_PLACE_GENERATOR")
    @Column(name = "PLACE_ID")
    private Long id;
    private String subTitle;
    @Column(length = 2000)
    private String info;
    @Column(length = 2000)
    private String rule;
    private Integer defaultPeople;
    @Embedded
    private PostAddress placeAddress;
    private Integer price;  //기본요금
    private Integer surcharge;  //추가요금
    private String bankName;
    private String accountNumber; //계좌번호
    private String accountHolder; //예금주
    @Enumerated(EnumType.STRING)
    private PlaceStatus placeStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID")
    private User user;

    @Builder
    public Place(String title, int viewCount, Double lat, Double lng, Long id, String subTitle, String info, String rule, Integer defaultPeople, PostAddress placeAddress, Integer price, Integer surcharge, String bankName, String accountNumber, String accountHolder, PlaceStatus placeStatus, User user) {
        super(title, viewCount, lat, lng);
        this.id = id;
        this.subTitle = subTitle;
        this.info = info;
        this.rule = rule;
        this.defaultPeople = defaultPeople;
        this.placeAddress = placeAddress;
        this.price = price;
        this.surcharge = surcharge;
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
        this.placeStatus = placeStatus;
        this.user = user;
    }
}



