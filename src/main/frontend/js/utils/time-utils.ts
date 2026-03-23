/**
 * 주어진 날짜/시간과 현재 시간의 차이를 계산하여 직관적인 문자열로 반환합니다.
 *
 * @param datetime 비교할 과거의 날짜/시간 (문자열 또는 Date 객체)
 * @returns '방금 전', 'X분 전', 'X시간 전', 'X일 전', 'X개월 전', 'X년 전' 형식의 문자열
 */
export function getTimeGapFromNow(datetime: string | Date): string {
    const now = new Date();
    const date = new Date(datetime);
    let gap = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

    if (gap < 1) {
        return "방금 전";
    }
    if (gap < 60) {
        return `${gap}분 전`;
    }

    gap = Math.floor(gap / 60);
    if (gap < 24) {
        return `${gap}시간 전`;
    }

    gap = Math.floor(gap / 24);
    if (gap < 32) {
        return `${gap}일 전`;
    }

    gap = Math.floor(gap / 31);
    if (gap < 13) {
        return `${gap}개월 전`;
    }

    gap = Math.floor(gap / 12);
    return `${gap}년 전`;
}

/**
 * 날짜 문자열을 한국어 표기법을 적용한 상세한 날짜 및 시간 형식으로 변환합니다.
 *
 * @param datetimeString 변환할 날짜 문자열
 * @returns 'YYYY년 M월 D일 HH:mm' 형식의 한국어 시간 문자열
 */
export function formatKoreanDatetime(datetimeString: string | Date): string {
    return new Date(datetimeString).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    });
}

/**
 * 날짜 문자열을 한국어 표기법을 적용한 날짜 형식으로 변환합니다.
 *
 * @param dateString 변환할 날짜 문자열
 * @returns 'YYYY년 M월 D일' 형식의 한국어 날짜 문자열
 */
export function formatKoreanDate(dateString: string | Date): string {
    return new Date(dateString).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * 두 Date 객체 간의 일(Day) 단위 차이를 계산합니다.
 *
 * @param date1 첫 번째 날짜
 * @param date2 두 번째 날짜
 * @returns 두 날짜 간의 일수 차이 (절댓값)
 */
export function dateDifferenceInDays(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const timeDifference = Math.abs(date2.getTime() - date1.getTime());

    return Math.round(timeDifference / oneDay);
}

/**
 * Date 객체를 'YYYY-MM-DD' 형식의 문자열로 변환합니다.
 *
 * @param date 변환할 Date 객체
 * @returns 'YYYY-MM-DD' 형식의 문자열
 */
export function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}