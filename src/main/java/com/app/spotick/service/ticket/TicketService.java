package com.app.spotick.service.ticket;

import com.app.spotick.domain.dto.ticket.*;
import com.app.spotick.domain.dto.ticket.grade.TicketGradeSaleInfoDto;
import com.app.spotick.domain.type.ticket.TicketCategory;
import com.app.spotick.domain.type.ticket.TicketRatingType;
import com.app.spotick.global.util.search.DistrictFilter;
import com.app.spotick.global.util.type.TicketSortType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

public interface TicketService {

    void registerTicket(TicketRegisterDto ticketRegisterDto, Long userId) throws IOException;

    Slice<TicketListDto> findTicketListPage(Pageable pageable, TicketCategory ticketCategory, TicketRatingType ticketRatingType, TicketSortType ticketSortType, DistrictFilter districtFilter, Long userId, String keyword);

    List<TicketGradeSaleInfoDto> findTicketGrades(Long ticketId, LocalDate date);

    TicketDetailDto findTicketDetailById(Long ticketId, Long userId);

    TicketEditDto findTicketEditById(Long ticketId, Long userId);

    void updateTicket(TicketEditDto ticketEditDto, Long userId) throws IOException;
}
