package com.cwww.minihompy.mapper;

import com.cwww.minihompy.dto.response.BgmOptionResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MinihompyBgmMapper {

    // 내가 보유한 (user_inventory) BGM 목록 조회 - 지금 적용중인지(applied)까지 포함
    List<BgmOptionResponse> selectOwnedBgmOptions(@Param("userId") Long userId);

    // 진짜 이 유저가 이 아이템을 보유하고 있는지 재검증 (적용 시 위조 방지)
    int countOwnedBgmItem(
            @Param("userId") Long userId,
            @Param("itemId") Long itemId);

    // BGM 적용 - minihompy.media_id를 그 아이템의 media_id로 갱신
    int applyBgm(
            @Param("userId") Long userId,
            @Param("itemId") Long itemId);

    // BGM 끄기 - minihompy.media_id를 NULL로 초기화
    int clearBgm(@Param("userId") Long userId);

    // itemId로 해당 BGM의 재생 URL 조회 (적용 성공 응답에 바로 실어주기 위함)
    String selectMediaUrlByItemId(@Param("itemId") Long itemId);

    // 미니홈피 존재 여부 확인 (없으면 "보유 없음"과 구분하기 위함)
    int countMinihompyByUserId(@Param("userId") Long userId);

}
