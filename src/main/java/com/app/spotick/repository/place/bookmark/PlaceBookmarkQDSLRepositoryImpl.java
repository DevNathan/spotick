package com.app.spotick.repository.place.bookmark;

import com.app.spotick.domain.dto.place.PlaceListDto;
import com.app.spotick.domain.dto.place.file.PlaceFileDto;
import com.app.spotick.domain.type.post.PostStatus;
import com.app.spotick.global.util.type.PlaceSortType;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
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
import java.util.Map;
import java.util.stream.Collectors;

import static com.app.spotick.domain.entity.place.QPlace.place;
import static com.app.spotick.domain.entity.place.QPlaceBookmark.placeBookmark;
import static com.app.spotick.domain.entity.place.QPlaceFile.placeFile;
import static com.app.spotick.domain.entity.place.QPlaceInquiry.placeInquiry;
import static com.app.spotick.domain.entity.place.QPlaceReview.placeReview;

@RequiredArgsConstructor
public class PlaceBookmarkQDSLRepositoryImpl implements PlaceBookmarkQDSLRepository {
    private final JPAQueryFactory queryFactory;

    @Override
    public Page<PlaceListDto> findBookmarkedPlacesByUserId(Long userId, Pageable pageable, PlaceSortType sortType) {
        // 게시글 전체 갯수 확인
        JPAQuery<Long> totalCountQuery = queryFactory.select(place.count())
                .from(placeBookmark)
                .join(placeBookmark.place, place)
                .where(placeBookmark.user.id.eq(userId), place.placeStatus.eq(PostStatus.APPROVED));

        JPQLSubQuery<Double> reviewAvg = createReviewAvgSub();

        JPQLSubQuery<Long> reviewCount = createReviewCountSub();

        JPQLSubQuery<Long> bookmarkCount = createBookmarkCountSub();

        /*
            리스트 생성 쿼리, (생성자에서 placeFileDto 리스트는 제외하여 Projections.constructor 사용에 걸림이 없게 한다.
         */
        List<PlaceListDto> placeListDtos = queryFactory.select(
                        Projections.constructor(PlaceListDto.class,
                                place.id,
                                place.title,
                                place.price,
                                place.placeAddress,
                                reviewAvg,
                                reviewCount,
                                bookmarkCount,
                                // 북마크 리스트에서 북마크 체크는 필요없음. 이미되어있기때문에 가져와지기 때문.
                                Expressions.constant(true)
                        )
                )
                .from(placeBookmark)
                .join(placeBookmark.place, place)
                .where(placeBookmark.user.id.eq(userId), place.placeStatus.eq(PostStatus.APPROVED))
                .orderBy(createOrderByClause(sortType))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        List<Long> placeIdList = placeListDtos.stream().map(PlaceListDto::getId).toList();

        List<PlaceFileDto> fileDtoList = queryFactory.select(
                        Projections.constructor(PlaceFileDto.class,
                                placeFile.id,
                                placeFile.fileName,
                                placeFile.uuid,
                                placeFile.uploadPath,
                                placeFile.place.id
                        ))
                .from(placeFile)
                .where(placeFile.place.id.in(placeIdList))
                .orderBy(placeFile.id.asc(), placeFile.place.id.desc())
                .fetch();

//        사진정보를 장소 id별로 묶는다
        Map<Long, List<PlaceFileDto>> fileListMap = fileDtoList.stream().collect(Collectors.groupingBy(PlaceFileDto::getPlaceId));

//        장소 id별로 구분된 사진들을 각각 게시글 번호에 맞게 추가한다
        placeListDtos.forEach(placeListDto -> {
            placeListDto.updatePlaceFiles(fileListMap.get(placeListDto.getId())
                    .stream().limit(5L).toList());
            // 화면에서 뿌릴 주소값 가공
            placeListDto.getPlaceAddress().cutAddress();
        });

//트랜스폼 방안
//        List<PlaceListDto> placeListDtos = queryFactory.select(place)
//                .from(placeBookmark)
//                .join(placeBookmark.place, place)
//                .offset(pageable.getOffset())
//                .limit(pageable.getPageSize())
//                .innerJoin(placeFile)
//                .on(place.id.eq(placeFile.place.id))
//                .where(placeBookmark.user.id.eq(userId), place.placeStatus.eq(PostStatus.APPROVED))
//                .orderBy(place.id.desc())
//                .transform(GroupBy.groupBy(place.id)
//                        .list(Projections.constructor(PlaceListDto.class,
//                                place.id,
//                                place.title,
//                                place.price,
//                                place.placeAddress,
//                                list(
//                                        Projections.constructor(PlaceFileDto.class,
//                                                placeFile.id,
//                                                placeFile.fileName,
//                                                placeFile.uuid,
//                                                placeFile.uploadPath
//                                        )
//                                ),
//                                reviewAvg,
//                                reviewCount,
//                                bookmarkCount,
//                                // 북마크 리스트에서 북마크 체크는 필요없음. 이미되어있기때문에 가져와지기 때문.
//                                Expressions.constant(true)
//                        ))
//                );

//        placeListDtos.forEach(dto -> {
//            dto.getPlaceAddress().cutAddress();
//
//            dto.cutPlaceFilesForListPage();
//        });

        return PageableExecutionUtils.getPage(placeListDtos, pageable, totalCountQuery::fetchOne);
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

    private BooleanExpression isBookmarkCheckedSub(Long userId) {
        return userId == null ?
                Expressions.asBoolean(false)
                : JPAExpressions.select(placeBookmark.id.isNotNull())
                .from(placeBookmark)
                .where(placeBookmark.place.eq(place).and(placeBookmark.user.id.eq(userId)))
                .exists();
    }

    private OrderSpecifier<?>[] buildOrderSpecifiers(OrderSpecifier<?>... specifiers) {
        return specifiers;
    }

    private OrderSpecifier<?>[] createOrderByClause(PlaceSortType sortType) {
        return switch (sortType) {
            case POPULARITY -> buildOrderSpecifiers(
                    reviewAvgASC(),
                    reviewCountDESC(),
                    place.viewCount.desc(),
                    bookmarkCountDESC()
            );
            case NEWEST -> buildOrderSpecifiers(
                    place.createdDate.desc()
            );
            case INTEREST -> buildOrderSpecifiers(
                    bookmarkCountDESC(),
                    place.id.desc()
            );
            case PRICE_LOW_TO_HIGH -> buildOrderSpecifiers(
                    place.price.asc(),
                    place.id.desc()
            );
            case PRICE_HIGH_TO_LOW -> buildOrderSpecifiers(
                    place.price.desc(),
                    place.id.desc()
            );
            case VIEWS -> buildOrderSpecifiers(
                    place.viewCount.desc(),
                    place.id.desc()
            );
            case REVIEWS -> buildOrderSpecifiers(
                    reviewCountDESC(),
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

    private OrderSpecifier<?> reviewCountDESC() {
        return new OrderSpecifier<>(
                Order.DESC, createReviewCountSub()
        );
    }

    private OrderSpecifier<?> bookmarkCountDESC() {
        return new OrderSpecifier<>(
                Order.DESC, createBookmarkCountSub()
        );
    }
}


