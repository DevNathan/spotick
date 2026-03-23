package com.app.spotick.domain.entity.promotion;

import com.app.spotick.domain.base.image.ImageBase;
import com.app.spotick.domain.base.post.PostBase;
import com.app.spotick.domain.dto.promotion.FileDto;
import com.app.spotick.domain.dto.promotion.PromotionEditDto;
import com.app.spotick.domain.embedded.post.PostAddress;
import com.app.spotick.domain.entity.user.User;
import com.app.spotick.domain.type.post.PostStatus;
import com.app.spotick.domain.type.promotion.PromotionCategory;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "TBL_PROMOTION_BOARD")
@SequenceGenerator(name = "SEQ_PROMOTION_BOARD_GENERATOR", sequenceName = "SEQ_PROMOTION_BOARD", allocationSize = 1)
@Getter
@ToString(callSuper = true)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PromotionBoard extends ImageBase {
    @Id
    @GeneratedValue(generator = "SEQ_PROMOTION_BOARD_GENERATOR")
    @Column(name = "PROMOTION_ID")
    private Long id;
    private String title;
    private String subTitle;
    @Column(columnDefinition = "LONGTEXT")
    private String content;
    @Enumerated(EnumType.STRING)
    private PromotionCategory promotionCategory;
    @Enumerated(EnumType.STRING)
    private PostStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID")
    private User user;


    @Builder
    public PromotionBoard(String fileName, String uuid, String uploadPath, Long id, String title, String subTitle, String content, PromotionCategory promotionCategory, PostStatus status, User user) {
        super(fileName, uuid, uploadPath);
        this.id = id;
        this.title = title;
        this.subTitle = subTitle;
        this.content = content;
        this.promotionCategory = promotionCategory;
        this.status = status;
        this.user = user;
    }


    public void setWriter(User user) {
        this.user = user;
    }

    public void update(PromotionEditDto promotionEditDto) {
        FileDto file = promotionEditDto.getFileDto();

        this.title = promotionEditDto.getTitle();
        if (subTitle != null) {
            this.subTitle = promotionEditDto.getSubTitle();
        }
        this.content = promotionEditDto.getContent();
        this.promotionCategory = promotionEditDto.getCategory();
        super.updateImage(file.getFileName(), file.getUuid(), file.getUploadPath());
    }

    public void updateStatus(PostStatus status) {
        this.status = status;
    }
}
