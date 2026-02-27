package com.app.spotick.repository.ticket;

import com.app.spotick.domain.dto.ticket.TicketListDto;
import com.app.spotick.domain.embedded.post.PostAddress;
import com.app.spotick.domain.entity.ticket.Ticket;
import com.app.spotick.domain.entity.ticket.TicketFile;
import com.app.spotick.domain.entity.ticket.TicketGrade;
import com.app.spotick.domain.entity.user.User;
import com.app.spotick.domain.type.post.PostStatus;
import com.app.spotick.domain.type.ticket.TicketCategory;
import com.app.spotick.domain.type.user.UserStatus;
import com.app.spotick.global.util.type.TicketSortType;
import com.app.spotick.repository.ticket.file.TicketFileRepository;
import com.app.spotick.repository.ticket.grade.TicketGradeRepository;
import com.app.spotick.repository.user.UserRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.test.annotation.Commit;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@SpringBootTest
@Transactional
@Commit
class TicketRepositoryTest {
    @Autowired
    JPAQueryFactory queryFactory;
    @Autowired
    TicketRepository ticketRepository;
    @Autowired
    TicketFileRepository ticketFileRepository;
    @Autowired
    TicketGradeRepository ticketGradeRepository;
    @Autowired
    private UserRepository userRepository;

    @PersistenceContext
    EntityManager em;

    Ticket ticket;
    User user1;
    User user2;

    @BeforeEach
    void setUp() {
        Random random = new Random();
        user1 = User.builder()
                .id(1L)
                .email("aaa")
                .password("1234")
                .nickName("홍길동")
                .tel("0101111111")
                .userStatus(UserStatus.ACTIVATE)
                .build();
        userRepository.save(user1);

        user2 = User.builder()
                .id(2L)
                .email("bbb")
                .password("1234")
                .nickName("컨텐츠프로바이더")
                .tel("01022222222")
                .userStatus(UserStatus.ACTIVATE)
                .build();
        userRepository.save(user2);

        for (int i = 0; i < 50; i++) {
            TicketFile ticketFile = TicketFile.builder()
                    .uuid(UUID.randomUUID().toString())
                    .fileName("테스트")
                    .uploadPath("test")
                    .ticket(ticket)
                    .build();
            ticketFileRepository.save(ticketFile);

            ticket = Ticket.builder()
                    .title("테스트 제목" + i)
                    .content("테스트 내용" + i)
                    .ticketCategory(TicketCategory.CONCERT)
                    .ticketEventAddress(new PostAddress("서울특별시 강남구 테헤란로 " + i, "" + i))
                    .user(user2)
                    .ticketEventStatus(PostStatus.APPROVED)
                    .ticketFile(ticketFile)
                    .build();
            ticketRepository.save(ticket);

            List<TicketGrade> ticketGrades = new ArrayList<>();

            for (int j = 0; j < 3; j++) {
                ticketGrades.add(
                        TicketGrade.builder()
                                .gradeName("test" + j)
                                .maxPeople(50)
                                .price(10000 * j)
                                .build());
            }
            ticketGradeRepository.saveAll(ticketGrades);
        }

    }

    @Test
    @DisplayName("test")
    void save() {

    }

    @Test
    @DisplayName("qdsl테스트")
    void getList() {
        Pageable pageable = PageRequest.of(0, 5);


        Slice<TicketListDto> ticketListPage = ticketRepository.findTicketListPage(pageable, null, null, TicketSortType.POPULARITY, null, null, null);

        System.out.println("contents = " + ticketListPage.getContent());
    }
}