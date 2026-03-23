package com.app.spotick.domain.district;

import lombok.Getter;

@Getter
public enum Region {
    SEOUL("서울특별시", "서울", SeoulDistrict.values()),
    GYEONGGI("경기도", "경기", GyenggiDistrict.values()),
    INCHEON("인천광역시", "인천", IncheonDistrict.values()),
    BUSAN("부산광역시", "부산", BusanDistrict.values()),
    DAEJEON("대전광역시", "대전", DaejeonDistrict.values()),
    DAEGU("대구광역시", "대구", DaeguDistrict.values()),
    ULSAN("울산광역시", "울산", UlsanDistrict.values()),
    SEJONG("세종특별자치시", "세종", new District[]{}), // 세종은 단일 지역이므로 하위 구가 없음
    GWANGJU("광주광역시", "광주", GwangjuDistrict.values()),
    GANGWON("강원특별자치도", "강원", GangwonDistrict.values()),
    CHUNGBUK("충청북도", "충북", ChungbukDistrict.values()),
    CHUNGNAM("충청남도", "충남", ChungnamDistrict.values()),
    GYEONGBUK("경상북도", "경북", GyeongbukDistrict.values()),
    GYEONGNAM("경상남도", "경남", GyeongnamDistrict.values()),
    JEONBUK("전북특별자치도", "전북", JeonbukDistrict.values()),
    JEONNAM("전라남도", "전남", JeonnamDistrict.values()),
    JEJU("제주특별자치도", "제주", JejuDistrict.values());

    private final String fullName;
    private final String shortName;
    private final District[] districts;

    Region(String fullName, String shortName, District[] districts) {
        this.fullName = fullName;
        this.shortName = shortName;
        this.districts = districts;
    }
}