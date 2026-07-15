package com.cwww.guestbook.mapper;

import com.cwww.guestbook.domain.Guestbook;
import com.cwww.guestbook.dto.response.GuestbookResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.security.core.parameters.P;

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

    // 수정 (content, isSecret 둘 다 변경)
    int updateGuestbook(
            @Param("guestbookId") Long guestbookId,
            @Param("content") String content,
            @Param("secret") boolean secret);


    // 방명록 소프트 삭제 (작성자 본인, 홈피 주인 가능)
    int deleteGuestbook(@Param("guestbookId") Long guestbookId);


    // 삭제 전용 - guestbookId가 실제로 그 minihompyId 소속인지까지 검증 (다른 홈피 방명록 삭제 방지)
    Optional<Guestbook> findByIdAndMinihompyId(
            @Param("guestbookId") Long guestbookId,
            @Param("minihompyId") Long minihompyId);

}
