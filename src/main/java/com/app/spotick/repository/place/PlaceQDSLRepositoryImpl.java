package com.app.spotick.repository.place;

import com.app.spotick.domain.dto.place.PlaceDetailDto;
import com.app.spotick.domain.dto.place.PlaceEditDto;
import com.app.spotick.domain.dto.place.PlaceListDto;
import com.app.spotick.domain.dto.place.PlaceManageListDto;
import com.app.spotick.domain.dto.place.file.PlaceFileDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReserveBasicInfoDto;
import com.app.spotick.domain.dto.place.reservation.PlaceReservedNotReviewedDto;
import com.app.spotick.domain.dto.place.review.ContractedPlaceDto;
import com.app.spotick.domain.entity.place.Place;
import com.app.spotick.domain.entity.place.QPlaceFile;
import com.app.spotick.domain.entity.place.QPlaceReview;
import com.app.spotick.domain.type.place.PlaceReservationStatus;
import com.app.spotick.domain.type.post.PostStatus;
import com.app.spotick.global.util.search.DistrictFilter;
import com.app.spotick.global.util.type.PlaceManagerSortType;
import com.app.spotick.global.util.type.PlaceSortType;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberPath;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.JPQLQuery;
import com.querydsl.jpa.JPQLSubQuery;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.data.support.PageableExecutionUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.app.spotick.domain.entity.place.QPlace.place;
import static com.app.spotick.domain.entity.place.QPlaceBookmark.placeBookmark;
import static com.app.spotick.domain.entity.place.QPlaceFile.placeFile;
import static com.app.spotick.domain.entity.place.QPlaceInquiry.placeInquiry;
import static com.app.spotick.domain.entity.place.QPlaceReservation.placeReservation;
import static com.app.spotick.domain.entity.place.QPlaceReview.placeReview;

@RequiredArgsConstructor
public class PlaceQDSLRepositoryImpl implements PlaceQDSLRepository {
    private final JPAQueryFactory queryFactory;

    private final NumberPath<Long> aliasBookmarkCount = Expressions.numberPath(Long.class, "bookmarkCount");
    private final NumberPath<Long> aliasReviewCount = Expressions.numberPath(Long.class, "reviewCount");
    private final NumberPath<Double> aliasReviewAvg = Expressions.numberPath(Double.class, "reviewAvg");
    private final NumberPath<Long> aliasReservationCount = Expressions.numberPath(Long.class, "reservationCount");
    private final NumberPath<Long> aliasNotRespondedInquiryCount = Expressions.numberPath(Long.class, "inquiriesCount");

    @Override
    public Slice<PlaceListDto> findPlaceListPage(Pageable pageable, Long userId, PlaceSortType sortType, DistrictFilter districtFilter, String keyword) {
        JPQLSubQuery<Double> reviewAvg = createReviewAvgSub();
        JPQLSubQuery<Long> reviewCount = createReviewCountSub();
        JPQLSubQuery<Long> bookmarkCount = createBookmarkCountSub();
        BooleanExpression isBookmarkChecked = isBookmarkCheckedSub(userId);
        BooleanBuilder whereClause = new BooleanBuilder();
        whereClause.and(place.placeStatus.eq(PostStatus.APPROVED));

        if (districtFilter != null && districtFilter.getDistrict() != null) {
            if (!districtFilter.getDetailDistrict().isEmpty()) {
                BooleanBuilder booleanBuilder = new BooleanBuilder();
                for (String detailDistrict : districtFilter.getDetailDistrict()) {
                    booleanBuilder.or(place.placeAddress.address.like(districtFilter.getDistrict() + "%" + detailDistrict + "%"));
                }
                whereClause.and(booleanBuilder);
            } else {
                whereClause.and(place.placeAddress.address.like(districtFilter.getDistrict() + "%"));
            }
        }

        if (keyword != null) {
            whereClause.and(createSearchCondition(keyword));
        }


        List<PlaceListDto> placeListDtos = queryFactory.select(
                        Projections.constructor(PlaceListDto.class,
                                place.id,
                                place.title,
                                place.price,
                                place.placeAddress,
                                ExpressionUtils.as(reviewAvg, aliasReviewAvg),
                                ExpressionUtils.as(reviewCount, aliasReviewCount),
                                ExpressionUtils.as(bookmarkCount, aliasBookmarkCount),
                                isBookmarkChecked
                        )
                )
                .from(place)
                .where(whereClause)
                .orderBy(createOrderByClause(sortType))
                .offset(pageable.getOffset())   //페이지 번호
                .limit(pageable.getPageSize() + 1)  //페이지 사이즈
                .fetch();

        boolean hasNext = false;

        if (placeListDtos.size() > pageable.getPageSize()) {
            placeListDtos.remove(pageable.getPageSize());
            hasNext = true;
        }

//        포스트의 id만 list로 가져온다
        List<Long> placeIdList = placeListDtos.stream().map(PlaceListDto::getId).toList();

//        가져온 id리스트를 in절의 조건으로 사진정보들을 가져온다.
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

        return new SliceImpl<>(placeListDtos, pageable, hasNext);
    }

    @Override
    public Optional<PlaceDetailDto> findPlaceDetailById(Long placeId, Long userId) {
        JPQLSubQuery<Double> reviewAvgSub = createReviewAvgSub();
        JPQLSubQuery<Long> reviewCountSub = createReviewCountSub();
        JPQLSubQuery<Long> inquiryCountSub = createInquiryCountSub();
        BooleanExpression bookmarkCheckedSub = isBookmarkCheckedSub(userId);
        QPlaceReview subReview = new QPlaceReview("pr");

        JPQLSubQuery<Long> review5scoreCount = JPAExpressions.select(subReview.id.count())
                .from(subReview)
                .where(subReview.placeReservation.place.id.eq(placeId), subReview.score.eq(5));

        List<Tuple> tupleList = queryFactory.select(
                        place,
                        reviewAvgSub,
                        reviewCountSub,
                        inquiryCountSub,
                        bookmarkCheckedSub,
                        review5scoreCount
                ).from(place)
                .join(place.placeFileList).fetchJoin()
                .where(place.id.eq(placeId))
                .fetch();
        PlaceDetailDto placeDetailDto = tupleList.stream().map(tuple -> {
            Place foundPlace = tuple.get(place);
            PlaceDetailDto placeDetail = PlaceDetailDto.from(foundPlace);
            placeDetail.setPlaceFileList(foundPlace.getPlaceFileList().stream().map(PlaceFileDto::from).toList());
            placeDetail.setEvalAvg(tuple.get(reviewAvgSub) == null ? 0.0 : tuple.get(reviewAvgSub));
            placeDetail.setEvalCount(tuple.get(reviewCountSub));
            placeDetail.setInquiryCount(tuple.get(inquiryCountSub));
            placeDetail.setBookmarkChecked(tuple.get(bookmarkCheckedSub));
            placeDetail.setEval5ScoreCount(tuple.get(review5scoreCount));
            return placeDetail;
        }).findFirst().orElseThrow(() -> new IllegalStateException("잘못된 게시글"));

        return Optional.ofNullable(placeDetailDto);
    }

    @Override
    public Optional<PlaceReserveBasicInfoDto> findPlaceReserveBasicInfo(Long placeId) {
        QPlaceFile subFile = new QPlaceFile("subFile");
        PlaceReserveBasicInfoDto placeReserveBasicInfoDto = queryFactory.select(
                        Projections.constructor(PlaceReserveBasicInfoDto.class,
                                place.id,
                                place.title,
                                place.subTitle,
                                place.defaultPeople,
                                place.price,
                                place.surcharge,
                                Projections.constructor(PlaceFileDto.class,
                                        placeFile.id,
                                        placeFile.fileName,
                                        placeFile.uuid,
                                        placeFile.uploadPath,
                                        placeFile.place.id
                                )
                        )
                ).from(place)
                .join(place.placeFileList, placeFile)
                .where(place.id.eq(placeId).and(placeFile.id.eq(
                        JPAExpressions.select(subFile.id.min())
                                .from(subFile)
                                .where(subFile.place.id.eq(placeId)))
                ))
                .fetchOne();

        return Optional.ofNullable(placeReserveBasicInfoDto);
    }

    @Override
    public Page<PlaceReservedNotReviewedDto> findPlaceListNotRelatedToReview(Long userId, Pageable pageable) {
        JPAQuery<Long> totalCountQuery = queryFactory.select(placeReservation.count())
                .from(placeReservation)
                .join(placeReservation.place, place)
                .leftJoin(placeReservation.placeReview, placeReview)
                .where(placeReservation.user.id.eq(userId),
                        place.placeStatus.eq(PostStatus.APPROVED),
                        placeReservation.reservationStatus.eq(PlaceReservationStatus.COMPLETED),
                        placeReservation.checkOut.lt(LocalDateTime.now()),
                        placeReservation.notReviewing.eq(false),
                        placeReview.isNull());

        JPQLSubQuery<Double> reviewAvg = createReviewAvgSub();
        JPQLSubQuery<Long> reviewCount = createReviewCountSub();
        JPQLSubQuery<Long> bookmarkCount = createBookmarkCountSub();
        BooleanExpression isBookmarkChecked = isBookmarkCheckedSub(userId);

        List<PlaceReservedNotReviewedDto> notReviewListDtos = queryFactory.select(
                        Projections.constructor(PlaceReservedNotReviewedDto.class,
                                place.id,
                                placeReservation.id,
                                place.title,
                                place.price,
                                place.placeAddress,
                                reviewAvg,
                                reviewCount,
                                bookmarkCount,
                                isBookmarkChecked,
                                placeReservation.visitors,
                                placeReservation.checkIn,
                                placeReservation.checkOut,
                                placeReservation.content,
                                placeReservation.reservationStatus
                        )
                )
                .from(placeReservation)
                .join(placeReservation.place, place)
                .leftJoin(placeReservation.placeReview, placeReview)
                .where(
                        placeReservation.user.id.eq(userId),
                        place.placeStatus.eq(PostStatus.APPROVED),
                        placeReservation.reservationStatus.eq(PlaceReservationStatus.COMPLETED),
                        placeReservation.checkOut.lt(LocalDateTime.now()),
                        placeReservation.notReviewing.eq(false),
                        placeReview.isNull()
                )
                .orderBy(placeReservation.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        List<Long> placeIdList = notReviewListDtos.stream().map(PlaceReservedNotReviewedDto::getId).toList();

//        가져온 id리스트를 in절의 조건으로 사진정보들을 가져온다.
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

        Map<Long, List<PlaceFileDto>> fileListMap = fileDtoList.stream().collect(Collectors.groupingBy(PlaceFileDto::getPlaceId));

//        장소 id별로 구분된 사진들을 각각 게시글 번호에 맞게 추가한다
        notReviewListDtos.forEach(placeListDto -> {
            placeListDto.updatePlaceFiles(fileListMap.get(placeListDto.getId())
                    .stream().limit(5L).toList());
            // 화면에서 뿌릴 주소값 가공
            placeListDto.getPlaceAddress().cutAddress();
        });

        return PageableExecutionUtils.getPage(notReviewListDtos, pageable, totalCountQuery::fetchOne);
    }

    @Override
    public Page<PlaceManageListDto> findHostPlaceListByUserId(Long userId, Pageable pageable, PlaceManagerSortType sortType) {

        JPAQuery<Long> totalCount = queryFactory.select(place.count())
                .from(place)
                .where(
                        place.user.id.eq(userId),
                        place.placeStatus.ne(PostStatus.REPLACED),
                        place.placeStatus.ne(PostStatus.DELETED),
                        place.placeStatus.ne(PostStatus.MODIFICATION_REQUESTED)
                );

        JPQLSubQuery<Double> reviewAvg = createReviewAvgSub();
        JPQLSubQuery<Long> reviewCount = createReviewCountSub();
        JPQLSubQuery<Long> bookmarkCount = createBookmarkCountSub();

        List<PlaceManageListDto> placeManageListDtos = queryFactory.select(
                        Projections.constructor(PlaceManageListDto.class,
                                place.id,
                                place.title,
                                place.price,
                                place.placeAddress,
                                ExpressionUtils.as(reviewAvg, aliasReviewAvg),
                                ExpressionUtils.as(reviewCount, aliasReviewCount),
                                ExpressionUtils.as(bookmarkCount, aliasBookmarkCount),
                                place.placeStatus,
                                ExpressionUtils.as(createReservationCountSub(), aliasReservationCount),
                                ExpressionUtils.as(createNotRespondedInquiriesCountSub(), aliasNotRespondedInquiryCount)
                        ))
                .from(place)
                .where(
                        place.user.id.eq(userId),
                        place.placeStatus.ne(PostStatus.REPLACED),
                        place.placeStatus.ne(PostStatus.DELETED),
                        place.placeStatus.ne(PostStatus.MODIFICATION_REQUESTED)
                )
                .orderBy(createOrderByClause(sortType))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        List<Long> placeIdList = placeManageListDtos.stream().map(PlaceManageListDto::getId).toList();

//        가져온 id리스트를 in절의 조건으로 사진정보들을 가져온다.
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


        placeManageListDtos.forEach(placeManageListDto -> {
            placeManageListDto.updatePlaceFiles(fileListMap.get(placeManageListDto.getId())
                    .stream().limit(5L).toList());

            placeManageListDto.getPlaceAddress().cutAddress();
        });

        return PageableExecutionUtils.getPage(placeManageListDtos, pageable, totalCount::fetchOne);
    }

    @Override
    public Optional<ContractedPlaceDto> findPlaceBriefly(Long placeId, Long userId) {

        JPQLSubQuery<Double> reviewAvg = createReviewAvgSub();
        JPQLSubQuery<Long> reviewCount = createReviewCountSub();
        JPQLSubQuery<Long> bookmarkCount = createBookmarkCountSub();

        Optional<ContractedPlaceDto> contractedPlaceDto = Optional.ofNullable(queryFactory
                .from(place)
                .leftJoin(place.placeFileList, placeFile)
                .where(
                        place.id.eq(placeId),
                        place.user.id.eq(userId),
                        placeFile.id.eq(
                                JPAExpressions.select(placeFile.id.min())
                                        .from(placeFile)
                                        .where(placeFile.place.id.eq(place.id))
                        )
                )
                .select(
                        Projections.constructor(ContractedPlaceDto.class,
                                place.id,
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
                                bookmarkCount
                        )
                )
                .fetchOne());

        contractedPlaceDto.ifPresent(placeDto -> placeDto.getPlaceAddress().cutAddress());

        return contractedPlaceDto;
    }

    @Override
    public Optional<PlaceEditDto> findPlaceInfoByPlaceIdAndUserId(Long placeId, Long userId) {

        Optional<PlaceEditDto> content = Optional.ofNullable(queryFactory
                .from(place)
                .where(
                        place.id.eq(placeId),
                        place.user.id.eq(userId),
                        place.placeStatus.eq(PostStatus.APPROVED)
                                .or(place.placeStatus.eq(PostStatus.DISABLED))
                )
                .select(Projections.constructor(PlaceEditDto.class,
                        place.id,
                        place.user.id,
                        place.title,
                        place.subTitle,
                        place.info,
                        place.rule,
                        place.defaultPeople,
                        place.placeAddress.address,
                        place.placeAddress.addressDetail,
                        place.price,
                        place.surcharge,
                        place.bankName,
                        place.accountNumber,
                        place.accountHolder,
                        place.lat,
                        place.lng
                ))
                .fetchOne());

        if (content.isPresent()) {
            List<PlaceFileDto> fileDtoList = queryFactory.select(
                            Projections.constructor(PlaceFileDto.class,
                                    placeFile.id,
                                    placeFile.fileName,
                                    placeFile.uuid,
                                    placeFile.uploadPath,
                                    placeFile.place.id
                            ))
                    .from(placeFile)
                    .where(placeFile.place.id.eq(content.get().getPlaceId()))
                    .orderBy(placeFile.id.asc(), placeFile.place.id.desc())
                    .fetch();

            content.get().setPlaceSavedFileDtos(fileDtoList);
        }

        return content;
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

    private JPQLSubQuery<Long> createReservationCountSub() {
        return JPAExpressions.select(placeReservation.count())
                .from(placeReservation)
                .where(
                        placeReservation.place.eq(place),
                        placeReservation.reservationStatus.eq(PlaceReservationStatus.PENDING)
                );
    }

    private JPQLSubQuery<Long> createNotRespondedInquiriesCountSub() {
        return JPAExpressions.select(placeInquiry.count())
                .from(placeInquiry)
                .where(
                        placeInquiry.place.eq(place),
                        placeInquiry.response.isNull()
                );
    }

    private OrderSpecifier<?>[] createOrderByClause(PlaceSortType sortType) {
        return switch (sortType) {
            case POPULARITY -> buildOrderSpecifiers(
                    aliasReviewAvg.desc().nullsLast(), aliasReviewCount.desc(),
                    place.viewCount.desc(), aliasBookmarkCount.desc());
            case NEWEST -> buildOrderSpecifiers(
                    place.createdDate.desc()
            );
            case INTEREST -> buildOrderSpecifiers(
                    aliasBookmarkCount.desc(),
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
                    aliasReviewCount.desc(),
                    place.id.desc()
            );
            case RATING_HIGH -> buildOrderSpecifiers(
                    aliasReviewAvg.desc().nullsLast(),
                    place.id.desc()
            );
        };
    }

    private OrderSpecifier<?>[] createOrderByClause(PlaceManagerSortType sortType) {
        return switch (sortType) {
            case RESERVATION -> buildOrderSpecifiers(
                    aliasReservationCount.desc(),
                    place.id.desc()
            );
            case INQUIRY -> buildOrderSpecifiers(
                    aliasNotRespondedInquiryCount.desc(),
                    place.id.desc()
            );
            case POPULARITY -> buildOrderSpecifiers(
                    aliasReviewAvg.desc().nullsLast(), aliasReviewCount.desc(),
                    place.viewCount.desc(), aliasBookmarkCount.desc()
            );
            case NEWEST -> buildOrderSpecifiers(
                    place.createdDate.desc()
            );
            case INTEREST -> buildOrderSpecifiers(
                    aliasBookmarkCount.desc(),
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
                    aliasReviewCount.desc(),
                    place.id.desc()
            );
            case RATING_HIGH -> buildOrderSpecifiers(
                    aliasReviewAvg.desc().nullsLast(),
                    place.id.desc()
            );
        };
    }

    private OrderSpecifier<?>[] buildOrderSpecifiers(OrderSpecifier<?>... specifiers) {
        return specifiers;
    }

    private BooleanExpression createSearchCondition(String keyword) {
        BooleanExpression titleContains = place.title.contains(keyword);
        BooleanExpression subTitleContains = place.subTitle.contains(keyword);
        BooleanExpression addressContains = place.placeAddress.address.contains(keyword);
        BooleanExpression addressDetailContains = place.placeAddress.addressDetail.contains(keyword);

        return titleContains
                .or(subTitleContains)
                .or(addressContains)
                .or(addressDetailContains);

    }

}
