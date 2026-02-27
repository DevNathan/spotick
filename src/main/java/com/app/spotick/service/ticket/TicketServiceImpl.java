package com.app.spotick.service.ticket;

import com.app.spotick.domain.dto.ticket.*;
import com.app.spotick.domain.dto.ticket.grade.TicketGradeSaleInfoDto;
import com.app.spotick.domain.entity.ticket.Ticket;
import com.app.spotick.domain.entity.ticket.TicketFile;
import com.app.spotick.domain.entity.ticket.TicketGrade;
import com.app.spotick.domain.entity.ticket.TicketModifyRequest;
import com.app.spotick.domain.entity.user.User;
import com.app.spotick.domain.type.post.PostModifyStatus;
import com.app.spotick.domain.type.post.PostStatus;
import com.app.spotick.domain.type.ticket.TicketCategory;
import com.app.spotick.domain.type.ticket.TicketRatingType;
import com.app.spotick.global.util.search.DistrictFilter;
import com.app.spotick.global.util.type.TicketSortType;
import com.app.spotick.repository.ticket.TicketRepository;
import com.app.spotick.repository.ticket.grade.TicketGradeRepository;
import com.app.spotick.repository.ticket.modifyRequest.TicketModifyReqRepository;
import com.app.spotick.repository.user.UserRepository;
import com.app.spotick.service.ticket.file.TicketFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {
    private final TicketRepository ticketRepository;
    private final TicketGradeRepository ticketGradeRepository;
    private final TicketFileService ticketFileService;
    private final UserRepository userRepository;
    private final TicketModifyReqRepository ticketModifyReqRepository;

    @Override
    public void registerTicket(TicketRegisterDto ticketRegisterDto, Long userId) throws IOException {
        User tmpUser = userRepository.getReferenceById(userId);

        // 티켓 이벤트 파일 저장
        TicketFile ticketFile = ticketFileService.registerAndSaveTicketFile(ticketRegisterDto.getTicketFile());

        Ticket ticketEntity = ticketRegisterDto.toEntity();
        ticketEntity.setUser(tmpUser);
        ticketEntity.setStatus(PostStatus.REGISTRATION_PENDING);
        ticketEntity.setFile(ticketFile);

        // 티켓 이벤트 db저장
        Ticket savedTicket = ticketRepository.save(ticketEntity);


        // ticketGrades를 엔티티 타입으로 변환 후 entity리스트로 변환 -> 이후 saveAll
        List<TicketGrade> ticketGradeEntities = ticketRegisterDto.getTicketGrades().stream()
                .map(dto -> {
                    TicketGrade ticketGradeEntity = dto.toEntity();
                    ticketGradeEntity.setTicket(savedTicket);
                    return ticketGradeEntity;
                })
                .toList();
        ticketGradeRepository.saveAll(ticketGradeEntities);
    }

    @Override
    @Transactional(readOnly = true)
    public Slice<TicketListDto> findTicketListPage(Pageable pageable, TicketCategory ticketCategory, TicketRatingType ticketRatingType, TicketSortType ticketSortType, DistrictFilter districtFilter, Long userId, String keyword) {
        return ticketRepository.findTicketListPage(pageable, ticketCategory, ticketRatingType, ticketSortType, districtFilter, userId, keyword);
    }



    @Override
    @Transactional(readOnly = true)
    public List<TicketGradeSaleInfoDto> findTicketGrades(Long ticketId, LocalDate date) {
        return ticketGradeRepository.findTicketGradesByTicketId(ticketId, date);
    }

    @Override
    public TicketDetailDto findTicketDetailById(Long ticketId, Long userId) {
        return ticketRepository.findTicketDetailById(ticketId, userId).orElseThrow(
                NoSuchElementException::new
        );
    }

    @Override
    public TicketEditDto findTicketEditById(Long ticketId, Long userId) {
        return ticketRepository.findTicketEditById(ticketId, userId).orElseThrow(
                NoSuchElementException::new
        );
    }

    @Override
    public void updateTicket(TicketEditDto ticketEditDto, Long userId) throws IOException {
        User tmpUser = userRepository.getReferenceById(userId);

        Ticket originalTicket = ticketRepository.findByIdAndUser(ticketEditDto.getTicketId(), tmpUser).orElseThrow(
                NoSuchElementException::new
        );

        // 기존의 티켓정보는 수정한다.
        originalTicket.updateStatus(PostStatus.MODIFICATION_PENDING);

        // 파일의 경우, 새로 받아온 파일 정보가 있을 시 파일정보를 수정.
        TicketFile file;
        if (!ticketEditDto.getNewTicketFile().isEmpty()) {
            file = ticketFileService
                    .registerAndSaveTicketFile(ticketEditDto.getNewTicketFile());
        } else { // 변경점이 없을 경우 기존의 파일을 수정된 티켓에 넣어준다.
            file = originalTicket.getTicketFile();
        }

        Ticket changedTicket = ticketEditDto.toEntity(
                originalTicket.getUser(),
                file,
                originalTicket.getStartDate(),
                originalTicket.getEndDate()
        );
        changedTicket.updateStatus(PostStatus.MODIFICATION_REQUESTED);

        // 새 정보를 저장
        changedTicket = ticketRepository.save(changedTicket);

        // 요청테이블에 insert
        ticketModifyReqRepository.save(TicketModifyRequest.builder()
                .originalTicket(originalTicket)
                .changedTicket(changedTicket)
                .ticketModifyStatus(PostModifyStatus.PENDING)
                .build());
    }
}
