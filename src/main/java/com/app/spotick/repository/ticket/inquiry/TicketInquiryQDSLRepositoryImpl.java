package com.app.spotick.repository.ticket.inquiry;

import com.app.spotick.domain.dto.place.inquiry.UnansweredInquiryDto;
import com.app.spotick.domain.dto.ticket.TicketInquiryListDto;
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

import static com.app.spotick.domain.entity.ticket.QTicket.ticket;
import static com.app.spotick.domain.entity.ticket.QTicketGrade.ticketGrade;
import static com.app.spotick.domain.entity.ticket.QTicketInquiry.ticketInquiry;
import static com.app.spotick.domain.entity.user.QUser.user;
import static com.app.spotick.domain.entity.user.QUserProfileFile.userProfileFile;

@RequiredArgsConstructor
public class TicketInquiryQDSLRepositoryImpl implements TicketInquiryQDSLRepository {
    private final JPAQueryFactory queryFactory;

    @Override
    public Page<TicketInquiryListDto> findInquiryListByUserId(Long userId, Pageable pageable) {

        JPAQuery<Long> totalCount = queryFactory.select(ticketInquiry.count())
                .from(ticketInquiry)
                .where(ticketInquiry.user.id.eq(userId));

        JPQLSubQuery<Integer> lowestPrice = JPAExpressions.select(ticketGrade.price.min())
                .from(ticketGrade)
                .where(ticketGrade.ticket.eq(ticket));

        List<TicketInquiryListDto> contents = queryFactory
                .from(ticketInquiry)
                .join(ticketInquiry.ticket, ticket)
                .where(
                        ticketInquiry.user.id.eq(userId)
                )
                .orderBy(ticketInquiry.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .select(Projections.constructor(TicketInquiryListDto.class,
                        ticket.id,
                        ticketInquiry.id,
                        ticket.title,
                        ticket.ticketEventAddress,
                        ticket.ticketCategory,
                        lowestPrice,
                        ticket.startDate,
                        ticket.endDate,
                        ticket.ticketFile.fileName,
                        ticket.ticketFile.uuid,
                        ticket.ticketFile.uploadPath,
                        ticketInquiry.title,
                        ticketInquiry.content,
                        ticketInquiry.response,
                        ticketInquiry.response.isNotNull()
                ))
                .fetch();

        return PageableExecutionUtils.getPage(contents, pageable, totalCount::fetchOne);
    }

    @Override
    public Slice<UnansweredInquiryDto> findUnansweredInquiriesSlice(Long ticketId, Long userId, Pageable pageable) {

        List<UnansweredInquiryDto> contents = queryFactory
                .from(ticketInquiry)
                .join(ticketInquiry.user, user)
                .join(user.userProfileFile, userProfileFile)
                .where(
                        ticketInquiry.ticket.id.eq(ticketId),
                        ticket.user.id.eq(userId),
                        ticketInquiry.response.isNull()
                )
                .orderBy(ticketInquiry.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize() + 1)
                .select(
                        Projections.constructor(UnansweredInquiryDto.class,
                                ticketInquiry.id,
                                ticketInquiry.title,
                                ticketInquiry.content,
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
}
