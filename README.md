# SPOTICK - 장소 대여와 티켓팅을 한번에<br>Venue Rental and Ticketing Service at Once
![spotick-logo](https://github.com/spotick/spotick/assets/142222091/4af6c9ba-df10-4fe9-9478-2db17d55ae3e)

(이 프로젝트는 영리를 추구하는 프로젝트가 아니며 참여자의 개발 실력을 향상시키기 위한 목적의 프로젝트임을 밝힙니다.)

### 목차
1. [팀 구성](#1-팀-구성)
2. [프로젝트 기획의도](#2-프로젝트-기획의도)
    > [주요 서비스](#2-1-주요-서비스)
3. [개발 환경](#3-개발-환경)
    > [버전 정보](#3-1-버전-정보)
4. [ERD](#4-ERD)
5. [담당업무 및 진행도](#5-담당업무-및-진행도)


## 1. 팀 구성
|팀장|조남호|
|:--:|:--:|
|부팀장|김대연| 
|팀원|김병구|
|팀원|박민수|


## 2. 프로젝트 기획의도
    11번가의 티켓팅 서비스가 존재했던 시기에는 티켓팅 등록 절차가 복잡하고 번거로웠으며,
    뿐만아니라 현재는 해당 서비스가 사라졌습니다. 이에 대응하여 향상된 서비스를 개발하기로 하였습니다.
    새로운 플랫폼은 티켓 구매를 더욱 간단하게 하는 것 뿐만 아니라 장소 대여와 같은 다양한 기능을 제공하며, 
    사용자들은 간편한 방식으로 모든 종류의 행사에 참여하고 홍보할 수 있습니다.
    이 아이디어를 현재의 프로젝트로서 실현하였습니다.

### 2-1 주요 서비스 및 핵심 기술 역량
1) 원스톱 장소 대여 및 비동기 예약 시스템
    > 단순한 폼 제출을 넘어, REST API 기반의 비동기 통신과 CSR(Client-Side Rendering)을 전면 도입. 
    > 마이페이지 내 장소 관리 및 예약 시스템의 페이지 이동을 최소화하여 끊김 없는(Seamless) 사용자 경험과 빠른 렌더링 성능 확보.

2) 프론트엔드 성능 최적화 및 현대화된 UI/UX
    > Zero-Dependency 슬라이더: 무거운 외부 라이브러리(Swiper 등)를 과감히 제거. CSS scroll-snap과 바닐라 JavaScript/TypeScript만으로 커스텀 슬라이더를 구축하여 불필요한 번들 사이즈 감축 및 렌더링 성능 극대화. 
   > Promise 기반 커스텀 모달: 브라우저 기본 alert(), confirm()의 블로킹(Blocking) 이슈와 투박한 디자인을 폐기. 비동기 Promise 기반의 커스텀 모달 아키텍처를 직접 설계하여 엔터프라이즈급 UI 일관성 및 사용자 흐름 제어권 확보.

3) 안정적인 파일 시스템 제어 및 홍보 게시판
    > 사용자가 자유롭게 행사를 홍보할 수 있는 게시판 제공. 
   > NIO.2 기반 파일 처리: 기존 레거시의 한글 파일명 깨짐 및 업로드 오류를 원천 차단하기 위해 Java NIO.2 기반으로 파일 시스템 로직을 현대화. 어떠한 운영체제 환경에서도 이미지와 게시물 데이터의 정합성을 보장하는 견고한 인프라 구축.


## 3. 개발 환경
| IDE | Language | Library | Framework |
| --- | --- | --- | --- |
| <a href="https://code.visualstudio.com/"><img src="https://img.shields.io/badge/-VSCode-007ACC?logo=visualstudiocode"/></a> <a href="https://www.jetbrains.com/idea/"><img src="https://img.shields.io/badge/-IntelliJ-000000?logo=intellijidea"/></a> | <a href="https://www.java.com"><img src="https://img.shields.io/badge/Java-007396"/></a> <a href="https://www.javascript.com"><img src="https://img.shields.io/badge/Javascript-F7DF1E?logo=javascript&logoColor=black"/></a> <span><img src="https://img.shields.io/badge/HTML-E34F26?logo=html5&logoColor=white"/></span> <span><img src="https://img.shields.io/badge/CSS3-1572B6?logo=css3"/></span> | <a href="https://projectlombok.org/"><img src="https://img.shields.io/badge/Lombok-d9230f"/></a> <a href="https://jquery.com"><img src="https://img.shields.io/badge/jQuery-0769AD?logo=jquery"/></a> <a href="http://querydsl.com/"><img src="https://img.shields.io/badge/Querydsl-4183C4"/></a> <a href="https://summernote.org/"><img src="https://img.shields.io/badge/summernote-3FC6F7"/></a> | <a href="https://spring.io/"><img src="https://img.shields.io/badge/Spring-6DB33F?logo=spring&logoColor=white"/></a> <a href="https://spring.io/projects/spring-security"><img src="https://img.shields.io/badge/Spring%20Security-6DB33F?logo=springsecurity&logoColor=white"/></a> <a href="https://hibernate.org/"><img src="https://img.shields.io/badge/Hibernate-59666C?logo=hibernate"/></a> |

| DBMS                                                                                                                                                                                                                                         | API | VCS | ETC |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| --- | --- | --- |
| <img src="https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white"/> <a href="https://redis.com/brand-guidelines/"><img src="https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white"/></a> <a href="https://www.h2database.com"><img src="https://img.shields.io/badge/H2%20Database-244a64"/></a> | <a href="https://spring.io/projects/spring-data-jpa"><img src="https://img.shields.io/badge/JPA-6DB33F"/></a> <a href="https://www.bootpay.co.kr/"><img src="https://img.shields.io/badge/bootpay-4529e5"/></a> <a href="https://oauth.net/2/"><img src="https://img.shields.io/badge/OAuth2.0-000000"/></a> <br> <a href="https://coolsms.co.kr/"><img src="https://img.shields.io/badge/coolsms-327AB8"/></a> <a href="https://openai.com/"><img src="https://img.shields.io/badge/openAi-412991?logo=openai"/></a> | <a href="https://git-scm.com/downloads"><img src="https://img.shields.io/badge/Git-F05032?logo=git&logoColor=white"/></a> <a href="https://github.com/"><img src="https://img.shields.io/badge/GitHub-181717?logo=github"/></a> | <a href="https://www.thymeleaf.org/"><img src="https://img.shields.io/badge/Thymeleaf-005F0F?logo=thymeleaf"/></a> <a href="https://aws.amazon.com/"><img src="https://img.shields.io/badge/AWS-FF9900?logo=amazonaws"/></a> <a href="https://www.postman.com/"><img src="https://img.shields.io/badge/Postman-FF6C37?logo=postman&logoColor=white"/></a> <br> <a href="https://tomcat.apache.org/"><img src="https://img.shields.io/badge/Tomcat-F8DC75?logo=apachetomcat&logoColor=black"/></a> <a href="https://gradle.org/"><img src="https://img.shields.io/badge/Gradle-02303A?logo=gradle&logoColor=white"/></a> |

### 3-1 버전 정보
<a href="https://spring.io/"><img src="https://img.shields.io/badge/3.2.0-Spring-6DB33F?logo=spring&logoColor=6DB33F"/></a>
<a href="https://www.java.com"><img src="https://img.shields.io/badge/JDK%2017-Java-007396"/></a>
<a href="https://hibernate.org/"><img src="https://img.shields.io/badge/6.1.5.Final-Hibernate-59666C?logo=hibernate&logoColor=white"/></a>
 <a href="https://www.oracle.com"><img src="https://img.shields.io/badge/11G%20Express-Oracle-F80000?logo=oracle&logoColor=F80000"/></a>
 <a href="https://redis.com/brand-guidelines/"><img src="https://img.shields.io/badge/3.0.504-Redis-DC382D?logo=redis&logoColor=DC382D"/></a>


## 4. ERD
![image](https://github.com/spotick/spotick/assets/142222091/4de433a5-697d-448e-ac87-3e62d7eee8a0)

<br>

[ERD 링크](https://dbdiagram.io/d/Spotick-641176d6296d97641d88104d)


## 5. 담당업무 및 진행도
![스크린샷 2024-02-26 073400](https://github.com/spotick/spotick/assets/142222091/fd1fe0f1-25ee-48a3-b636-aa3a10dc36f9)

퍼블리싱 진행
    > 2023년 12월 09일 ~ 2024년 01월 06일

<br>

![스크린샷 2024-02-26 073326](https://github.com/spotick/spotick/assets/142222091/3aba1819-6519-4ec8-abf2-32e8db4e2ced)

프론트/백엔드 작업 진행
    > 2024년 01월 11일 ~ 2024년 02월 25일

[작업진행도 링크](https://docs.google.com/spreadsheets/d/1dxkic3HMWeWARgZNHwB4UMllsB2hfidbuED7Jl2lGYs/edit#gid=2019515064)




