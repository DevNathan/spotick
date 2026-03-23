/**
 * Spring Data Slice 객체의 공통 인터페이스입니다.
 * 전체 데이터 개수를 카운트하지 않아 무한 스크롤이나 더보기 버튼 방식에 적합합니다.
 */
export interface Slice<T> {
  content: T[];
  pageable: any;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  sort: any;
  numberOfElements: number;
  empty: boolean;
}
