package com.app.spotick.repository.ticket;

import com.app.spotick.domain.dto.page.TicketPage;
import com.app.spotick.domain.dto.ticket.TicketDetailDto;
import com.app.spotick.domain.dto.ticket.TicketEditDto;
import com.app.spotick.domain.dto.ticket.TicketInfoDto;
import com.app.spotick.domain.dto.ticket.TicketListDto;
import com.app.spotick.domain.type.ticket.TicketCategory;
import com.app.spotick.domain.type.ticket.TicketRatingType;
import com.app.spotick.domain.type.ticket.TicketRequestType;
import com.app.spotick.global.util.search.DistrictFilter;
import com.app.spotick.global.util.type.TicketSortType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.util.Optional;

public interface TicketQDSLRepository {

    TicketPage findHostTicketListByUserId(Long userId, Pageable pageable, TicketRequestType ticketRequestType);

    Optional<TicketInfoDto> findTicketInfoByTicketId(Long ticketId, Long userId);

    Slice<TicketListDto> findTicketListPage(Pageable pageable, TicketCategory ticketCategory, TicketRatingType ticketRatingType, TicketSortType ticketSortType, DistrictFilter districtFilter, Long userId, String keyword);

    Optional<TicketDetailDto> findTicketDetailById(Long ticketId, Long userId);

    Optional<TicketEditDto> findTicketEditById(Long ticketId, Long userId);

}
