package com.app.spotick.service.promotion;

import com.app.spotick.domain.dto.promotion.*;
import com.app.spotick.domain.type.promotion.PromotionCategory;
import com.app.spotick.global.util.type.PromotionSortType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;

import java.io.IOException;
import java.util.List;

public interface PromotionService {

    Long promotionBoardSave(PromotionRegisterDto promotionRegisterDto) throws IOException;

    PromotionDetailDto getPromotionBoardById(Long promotionId, Long userId);

    Slice<PromotionListDto> getPromotionBoards(Pageable pageable, PromotionCategory category, PromotionSortType sortType, String keyword);

    Slice<PromotionListDto> getPromotionBoardsOfUser(Pageable pageable, Long writerId, Long promotionId);

    List<PromotionRecommendListDto> getRecommendPromotionBoards();

    PromotionEditDto getPromotionBoardEdit(Long promotionId, Long userId);

    Long updatePromotionBoard(PromotionEditDto promotionEditDto) throws IOException;

    void softDeletePromotionBoard(Long promotionId, Long userId);
}
