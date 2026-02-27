package com.app.spotick.repository.place.Review;

import com.app.spotick.domain.dto.place.file.PlaceFileDto;
import com.app.spotick.domain.dto.place.review.MypageReviewListDto;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLQuery;
import com.querydsl.jpa.JPQLSubQuery;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;

import java.util.List;

import static com.app.spotick.domain.entity.place.QPlace.place;
import static com.app.spotick.domain.entity.place.QPlaceBookmark.placeBookmark;
import static com.app.spotick.domain.entity.place.QPlaceFile.placeFile;
import static com.app.spotick.domain.entity.place.QPlaceReservation.*;
import static com.app.spotick.domain.entity.place.QPlaceReview.placeReview;

@RequiredArgsConstructor
public class PlaceReviewQDSLRepositoryImpl implements PlaceReviewQDSLRepository {
    private final JPAQueryFactory queryFactory;

    @Override
    public Page<MypageReviewListDto> findReviewsByUserId(Long userId, Pageable pageable) {

        JPAQuery<Long> totalCountQuery = queryFactory.select(placeReview.count())
                .from(placeReview)
                .where(placeReview.user.id.eq(userId));

        JPQLSubQuery<Double> reviewAvg = JPAExpressions.select(placeReview.score.avg())
                .from(placeReview)
                .where(placeReview.placeReservation.place.eq(place));

        JPQLSubQuery<Long> reviewCount = JPAExpressions.select(placeReview.count())
                .from(placeReview)
                .where(placeReview.placeReservation.place.eq(place));

        JPQLSubQuery<Long> bookmarkCount = JPAExpressions.select(placeBookmark.count())
                .from(placeBookmark)
                .where(placeBookmark.place.eq(place));

        List<MypageReviewListDto> reviewListDtos = queryFactory
                .from(placeReview)
                .join(placeReview.placeReservation, placeReservation)
                .join(placeReservation.place, place)
                .leftJoin(place.placeFileList, placeFile)
                .where(placeReview.user.id.eq(userId),
                        placeFile.id.eq(
                                JPAExpressions.select(placeFile.id.min())
                                        .from(placeFile)
                                        .where(placeFile.place.id.eq(place.id))
                        )
                )
                .orderBy(placeReview.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .select(
                        Projections.constructor(MypageReviewListDto.class,
                                place.id,
                                placeReservation.id,
                                placeReview.id,
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
                                reviewAvg,
                                reviewCount,
                                bookmarkCount,
                                placeReview.createdDate,
                                placeReview.score,
                                placeReview.content
                        )
                )
                .fetch();

        reviewListDtos.forEach(dto -> {
            dto.getPlaceAddress().cutAddress();
        });

        return PageableExecutionUtils.getPage(reviewListDtos, pageable, totalCountQuery::fetchOne);
    }
}
