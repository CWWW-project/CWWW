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
	int insertDefaultMinihompy(Minihompy minihompy);
	
}
