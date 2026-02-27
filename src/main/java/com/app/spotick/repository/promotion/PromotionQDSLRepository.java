package com.app.spotick.repository.promotion;

import com.app.spotick.domain.dto.promotion.PromotionDetailDto;
import com.app.spotick.domain.dto.promotion.PromotionEditDto;
import com.app.spotick.domain.dto.promotion.PromotionListDto;
import com.app.spotick.domain.dto.promotion.PromotionRecommendListDto;
import com.app.spotick.domain.type.promotion.PromotionCategory;
import com.app.spotick.global.util.type.PromotionSortType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.util.List;
import java.util.Optional;

public interface PromotionQDSLRepository {

    Optional<PromotionDetailDto> findPromotionById(Long promotionId, Long userId);

    Slice<PromotionListDto> findPromotionList(Pageable pageable, PromotionCategory category, PromotionSortType sortType, String keyword);

    Slice<PromotionListDto> findPromotionListOfUser(Pageable pageable, Long writerId, Long promotionId);

    List<PromotionRecommendListDto> findRecommendPromotionList();

    Optional<PromotionEditDto> findBoardForEditing(Long promotionId, Long userId);
}
