package com.cwww.guestbook.mapper;

import com.cwww.guestbook.domain.Guestbook;
import com.cwww.guestbook.dto.response.GuestbookResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface GuestbookMapper {

    // 방명록 작성
    int insertGuestbook(Guestbook guestbook);

    // ownerId(=user_id) 기준으로 minihompyId 조회
    Long selectMinihompyIdByOwnerId(@Param("ownerId") Long ownerId);

    // 순수 도메인 조회 (권한/소유자 체크용 - 목록 조회 dto와 별개)
    Optional<Guestbook> findById(@Param("guestbookId") Long guestbookId);

    // 목록 조회 (커서 기반, 닉네임 조인, 비밀글은 서비스에서 마스킹 처리
    List<GuestbookResponse> selectFeed(
            @Param("ownerId") Long ownerId,
            @Param("cursor") Long cursor,
            @Param("size") int size);

}
