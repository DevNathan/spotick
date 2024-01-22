package com.app.spotick.repository.promotion;

import com.app.spotick.domain.entity.promotion.PromotionBoard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PromotionRepository extends JpaRepository<PromotionBoard, Long> {
//    행사 등록 (기본 save() 사용)
//    행사 상세보기
//    행사 수정
//    행사 삭제

}
