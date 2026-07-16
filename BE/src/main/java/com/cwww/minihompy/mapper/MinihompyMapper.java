package com.cwww.minihompy.mapper;

import com.cwww.minihompy.domain.Minihompy;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.cwww.minihompy.dto.response.MinihompyMainResponse;


@Mapper
public interface MinihompyMapper {

	// 미니홈피 메인 조회
	MinihompyMainResponse selectMinihompyMain(@Param("ownerId") Long ownerId);
	
	// 미니홈피 기본 생성
	void insertDefaultMinihompy(Minihompy minihompy);

	// 미니홈피 설정 변경 (accessLevel, introduction, mood 한번에)
	int updateSettings(@Param("userId") Long userId,
					   @Param("accessLevel") Minihompy.AccessLevel accessLevel,
					   @Param("introduction") String introduction,
					   @Param("mood") String mood);


	// 도트 배경 색상 갱신 (null이면 색상 해제 - 사진으로 전환 시 사용)
	int updateBackgroundColor(
			@Param("userId") Long userId,
			@Param("backgroundColor") String backgroundColor);

}
