package com.cwww.minihompy.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.minihompy.domain.response.MinihompyMainResponse;
import com.cwww.minihompy.domain.response.MinihompyMainResponse.AccessLevel;
import com.cwww.minihompy.mapper.MinihompyMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MinihompyService {
	
	private final MinihompyMapper minihompyMapper;
	
	// 미니홈피 메인 조회
	@Transactional
	public MinihompyMainResponse getMinihompyMain(Long ownerId, Long viewerId) {
		
		MinihompyMainResponse response = minihompyMapper.selectMinihompyMain(ownerId);
		
		if(response == null) {
			// 본인이 처음 접근한 경우에만 기본 생성 (남의 미니홈피가 없다고 만들어주면 안 됨)
			if(viewerId != null && viewerId.equals(ownerId)) {
				
				minihompyMapper.insertDefaultMinihompy(ownerId);
				response = minihompyMapper.selectMinihompyMain(ownerId);
				
			}else {
				
				throw new BusinessException(ErrorCode.NOT_FOUND);
			}
			
		}
		
		// 권한 체크는 response가 null이든 아니든(=새로 만들어졌든 원래 있었든) 항상 실행돼야 함
		boolean isOwner = viewerId != null && viewerId.equals(ownerId);
		
		if(!isOwner && response.getAccessLevel() == AccessLevel.PRIVATE) {
			throw new BusinessException(ErrorCode.FORBIDDEN);
		}
		
		// TODO 일촌 체크 로직 필요
		
		return response;
	}


}
