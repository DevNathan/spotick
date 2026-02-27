package com.app.spotick.repository.promotion;

import com.app.spotick.domain.dto.promotion.*;
import com.app.spotick.domain.type.post.PostStatus;
import com.app.spotick.domain.type.promotion.PromotionCategory;
import com.app.spotick.global.util.type.PromotionSortType;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.app.spotick.domain.entity.promotion.QPromotionBoard.*;
import static com.app.spotick.domain.entity.promotion.QPromotionLike.*;
import static com.app.spotick.domain.entity.user.QUser.*;
import static com.app.spotick.domain.entity.user.QUserProfileFile.*;

@RequiredArgsConstructor
public class PromotionQDSLRepositoryImpl implements PromotionQDSLRepository {
    private final JPAQueryFactory queryFactory;

    @Override
    public Optional<PromotionDetailDto> findPromotionById(Long promotionId, Long userId) {

        return Optional.ofNullable(queryFactory
                .from(promotionBoard)
                .where(
                        promotionBoard.id.eq(promotionId),
                        promotionBoard.status.eq(PostStatus.APPROVED)
                )
                .join(user.userProfileFile, userProfileFile)
                .select(Projections.constructor(PromotionDetailDto.class,
                        promotionBoard.id,
                        user.id,
                        user.nickName,
                        Projections.constructor(FileDto.class,
                                userProfileFile.fileName,
                                userProfileFile.uuid,
                                userProfileFile.uploadPath
                        ),
                        promotionBoard.createdDate,
                        promotionBoard.title,
                        promotionBoard.subTitle,
                        promotionBoard.content,
                        Projections.constructor(FileDto.class,
                                promotionBoard.fileName,
                                promotionBoard.uuid,
                                promotionBoard.uploadPath
                        ),
                        promotionBoard.promotionCategory,
                        likeCount(),
                        isLiked(userId)
                ))
                .fetchOne());
    }

    @Override
    public Slice<PromotionListDto> findPromotionList(Pageable pageable,
                                                     PromotionCategory category,
                                                     PromotionSortType sortType,
                                                     String keyword) {
        BooleanExpression categoryCondition = null;
        BooleanExpression searchCondition = null;

        if (category != null) {
            categoryCondition = promotionBoard.promotionCategory.eq(category);
        }
        if (keyword != null) {
            searchCondition = createSearchCondition(keyword);
        }

        OrderSpecifier<?>[] orderByClause = createOrderByClause(sortType);


        List<PromotionListDto> contents = queryFactory
                .select(Projections.constructor(PromotionListDto.class,
                        promotionBoard.id,
                        promotionBoard.title,
                        Projections.constructor(FileDto.class,
                                promotionBoard.fileName,
                                promotionBoard.uuid,
                                promotionBoard.uploadPath
                        )
                ))
                .from(promotionBoard)
                .where(
                        promotionBoard.status.eq(PostStatus.APPROVED),
                        categoryCondition,
                        searchCondition
                )
                .orderBy(orderByClause)
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize() + 1)
                .fetch();

        boolean hasNext = false;

        if (contents.size() > pageable.getPageSize()) {
            contents.remove(pageable.getPageSize());
            hasNext = true;
        }

        return new SliceImpl<>(contents, pageable, hasNext);
    }

    @Override
    public Slice<PromotionListDto> findPromotionListOfUser(Pageable pageable, Long writerId, Long promotionId) {
        List<PromotionListDto> contents = queryFactory
                .select(Projections.constructor(PromotionListDto.class,
                        promotionBoard.id,
                        promotionBoard.title,
                        Projections.constructor(FileDto.class,
                                promotionBoard.fileName,
                                promotionBoard.uuid,
                                promotionBoard.uploadPath
                        )
                ))
                .from(promotionBoard)
                .where(
                        promotionBoard.status.eq(PostStatus.APPROVED),
                        promotionBoard.user.id.eq(writerId),
                        promotionBoard.id.ne(promotionId)
                )
                .orderBy(promotionBoard.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize() + 1)
                .fetch();

        boolean hasNext = false;

        if (contents.size() > pageable.getPageSize()) {
            contents.remove(pageable.getPageSize());
            hasNext = true;
        }

        return new SliceImpl<>(contents, pageable, hasNext);
    }

    @Override
    public List<PromotionRecommendListDto> findRecommendPromotionList() {
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);

        return queryFactory
                .from(promotionBoard)
                .where(
                        promotionBoard.status.eq(PostStatus.APPROVED),
                        promotionBoard.createdDate.after(oneMonthAgo)
                )
                .orderBy(
                        promotionLikeCountDESC(),
                        promotionBoard.id.desc()
                )
                .limit(10)
                .select(Projections.constructor(PromotionRecommendListDto.class,
                        promotionBoard.id,
                        promotionBoard.title,
                        promotionBoard.subTitle,
                        Projections.constructor(FileDto.class,
                                promotionBoard.fileName,
                                promotionBoard.uuid,
                                promotionBoard.uploadPath
                        )
                ))
                .fetch();
    }

    @Override
    public Optional<PromotionEditDto> findBoardForEditing(Long promotionId, Long userId) {
        return Optional.ofNullable(queryFactory
                .from(promotionBoard)
                .where(
                        promotionBoard.status.eq(PostStatus.APPROVED),
                        promotionBoard.id.eq(promotionId),
                        promotionBoard.user.id.eq(userId)
                )
                .select(Projections.constructor(PromotionEditDto.class,
                        promotionBoard.id,
                        promotionBoard.title,
                        promotionBoard.subTitle,
                        promotionBoard.content,
                        promotionBoard.promotionCategory,
                        Projections.constructor(FileDto.class,
                                promotionBoard.fileName,
                                promotionBoard.uuid,
                                promotionBoard.uploadPath
                        )
                ))
                .fetchOne());
    }


    //// private
    private JPQLQuery<Long> likeCount() {
        return (JPQLQuery<Long>) JPAExpressions
                .select(promotionLike.count())
                .from(promotionLike)
                .where(promotionLike.promotionBoard.eq(promotionBoard));
    }

    private BooleanExpression isLiked(Long userId) {
        return userId == null ?
                Expressions.asBoolean(false)
                : JPAExpressions.select(promotionLike.id.isNotNull())
                .from(promotionLike)
                .where(promotionLike.promotionBoard.eq(promotionBoard).and(promotionLike.user.id.eq(userId)))
                .exists();
    }

    private OrderSpecifier<?> promotionLikeCountDESC() {
        return new OrderSpecifier<>(
                Order.DESC, likeCount()
        );
    }

    private OrderSpecifier<?>[] buildOrderSpecifiers(OrderSpecifier<?>... specifiers) {
        return specifiers;
    }

    private OrderSpecifier<?>[] createOrderByClause(PromotionSortType sortType) {
        return switch (sortType) {
            case NEWEST -> buildOrderSpecifiers(
                    promotionBoard.createdDate.desc()
            );
            case INTEREST -> buildOrderSpecifiers(
                    promotionLikeCountDESC(),
                    promotionBoard.id.desc()
            );
        };
    }

    private BooleanExpression createSearchCondition(String keyword) {
        BooleanExpression titleContains = promotionBoard.title.contains(keyword);
        BooleanExpression subTitleContains = promotionBoard.subTitle.contains(keyword);
        BooleanExpression contentContains = promotionBoard.content.contains(keyword);

        return titleContains
                .or(subTitleContains)
                .or(contentContains);
    }
}
