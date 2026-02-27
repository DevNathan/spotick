package com.app.spotick.repository.place.reservation;

import com.app.spotick.domain.dto.place.PlaceReservationListDto;
import com.app.spotick.domain.dto.place.file.PlaceFileDto;
import com.app.spotick.domain.dto.place.reservation.ReservationRequestListDto;
import com.app.spotick.domain.type.place.PlaceReservationStatus;
import com.app.spotick.domain.type.post.PostStatus;
import com.app.spotick.global.util.type.PlaceReservationSortType;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLSubQuery;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.data.support.PageableExecutionUtils;

import java.util.List;

import static com.app.spotick.domain.entity.place.QPlace.place;
import static com.app.spotick.domain.entity.place.QPlaceBookmark.placeBookmark;
import static com.app.spotick.domain.entity.place.QPlaceFile.placeFile;
import static com.app.spotick.domain.entity.place.QPlaceInquiry.placeInquiry;
import static com.app.spotick.domain.entity.place.QPlaceReservation.placeReservation;
import static com.app.spotick.domain.entity.place.QPlaceReview.placeReview;
import static com.app.spotick.domain.entity.user.QUser.user;
import static com.app.spotick.domain.entity.user.QUserProfileFile.userProfileFile;

@RequiredArgsConstructor
public class PlaceReservationQDSLRepositoryImpl implements PlaceReservationQDSLRepository {
    private final JPAQueryFactory queryFactory;

    @Override
    public Page<PlaceReservationListDto> findReservationsByUserId(Long userId, Pageable pageable, PlaceReservationSortType sortType) {
        // 게시글 전체 갯수 확인
        JPAQuery<Long> totalCountQuery = queryFactory.select(placeReservation.count())
                .from(placeReservation)
                .join(placeReservation.place, place)
                .where(placeReservation.user.id.eq(userId), place.placeStatus.eq(PostStatus.APPROVED));

        List<PlaceReservationListDto> placeReservationListDtos = queryFactory
                .from(placeReservation)
                .join(placeReservation.place, place)
                .leftJoin(place.placeFileList, placeFile)
                .where(placeReservation.user.id.eq(userId),
                        placeReservation.reservationStatus.ne(PlaceReservationStatus.DELETED),
                        placeFile.id.eq(
                                JPAExpressions.select(placeFile.id.min())
                                        .from(placeFile)
                                        .where(placeFile.place.id.eq(place.id))
                        )
                )
                .orderBy(createOrderByClause(sortType))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .select(
                        Projections.constructor(PlaceReservationListDto.class,
                                place.id,
                                placeReservation.id,
                                place.title,
                                place.price,
                                place.placeAddress,
                                Projections.constructor(PlaceFileDto.class,
                                        placeFile.id,
                                        placeFile.fileName,
                                        placeFile.uuid,
                                        placeFile.uploadPath,
                                        place.id
                                ),
                                createReviewAvgSub(),
                                createReviewCountSub(),
                                createBookmarkCountSub(),
                                placeReservation.visitors,
                                placeReservation.checkIn,
                                placeReservation.checkOut,
                                placeReservation.content,
                                placeReservation.reservationStatus
                        )
                )
                .fetch();

        placeReservationListDtos.forEach(dto -> {
            dto.getPlaceAddress().cutAddress();
        });

        return PageableExecutionUtils.getPage(placeReservationListDtos, pageable, totalCountQuery::fetchOne);
    }

    @Override
    public Slice<ReservationRequestListDto> findReservationsByPlaceIdAndUserIdSlice(Long placeId, Long userId, Pageable pageable) {

        List<ReservationRequestListDto> contents = queryFactory
                .from(placeReservation)
                .join(placeReservation.user, user)
                .join(user.userProfileFile, userProfileFile)
                .where(
                        placeReservation.place.id.eq(placeId),
                        placeReservation.place.user.id.eq(userId),
                        placeReservation.reservationStatus.eq(PlaceReservationStatus.PENDING)
                )
                .orderBy(placeReservation.checkIn.asc(), placeReservation.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize() + 1)
                .select(
                        Projections.constructor(ReservationRequestListDto.class,
                                placeReservation.id,
                                placeReservation.visitors,
                                placeReservation.checkIn,
                                placeReservation.checkOut,
                                placeReservation.amount,
                                placeReservation.content,
                                user.nickName,
                                userProfileFile.fileName,
                                userProfileFile.uuid,
                                userProfileFile.uploadPath,
                                userProfileFile.isDefaultImage
                        )
                )
                .fetch();

        boolean hasNext = false;

        if (contents.size() > pageable.getPageSize()) {
            contents.remove(pageable.getPageSize());
            hasNext = true;
        }

        return new SliceImpl<>(contents, pageable, hasNext);
    }

    private JPQLSubQuery<Double> createReviewAvgSub() {
        return JPAExpressions.select(placeReview.score.avg())
                .from(placeReview)
                .where(placeReview.placeReservation.place.eq(place));
    }

    private JPQLSubQuery<Long> createReviewCountSub() {
        return JPAExpressions.select(placeReview.count())
                .from(placeReview)
                .where(placeReview.placeReservation.place.eq(place));
    }

    private JPQLSubQuery<Long> createBookmarkCountSub() {

        return JPAExpressions.select(placeBookmark.count())
                .from(placeBookmark)
                .where(placeBookmark.place.eq(place));
    }

    private JPQLSubQuery<Long> createInquiryCountSub() {
        return JPAExpressions.select(placeInquiry.id.count())
                .from(placeInquiry)
                .where(placeInquiry.place.eq(place));
    }

    private OrderSpecifier<?>[] createOrderByClause(PlaceReservationSortType sortType) {
        return switch (sortType) {
            case UPCOMING -> buildOrderSpecifiers(
                    placeReservation.checkIn.desc()
            );
            case NEWEST -> buildOrderSpecifiers(
                    place.createdDate.desc()
            );
            case PRICE_LOW_TO_HIGH -> buildOrderSpecifiers(
                    place.price.asc(),
                    place.id.desc()
            );
            case PRICE_HIGH_TO_LOW -> buildOrderSpecifiers(
                    place.price.desc(),
                    place.id.desc()
            );
            case RATING_HIGH -> buildOrderSpecifiers(
                    reviewAvgASC(),
                    place.id.desc()
            );
        };
    }

    private OrderSpecifier<?> reviewAvgASC() {
        return new OrderSpecifier<>(
                Order.ASC, createReviewAvgSub()
        );
    }

    private OrderSpecifier<?>[] buildOrderSpecifiers(OrderSpecifier<?>... specifiers) {
        return specifiers;
    }
}









