/**
 * Spring Data Page 객체의 공통 인터페이스입니다.
 */
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  empty: boolean;
}

/**
 * 페이지네이션 정보 인터페이스입니다.
 */
export interface PaginationData {
  blockSize: number;
  currentPage: number;
  startPage: number;
  endPage: number;
  lastPage: number;
  hasNextBlock: boolean;
  hasPrevBlock: boolean;
}

/**
 * 페이지 응답 공통 인터페이스입니다.
 */
export interface PageResponse<T> {
  data: Page<T>;
  pagination: PaginationData;
}
