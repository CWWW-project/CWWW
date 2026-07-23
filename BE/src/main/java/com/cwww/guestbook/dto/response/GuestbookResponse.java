package com.cwww.guestbook.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class GuestbookResponse {

    private Long guestbookId;
    private Long writerId;
    private String writerNickname;
    private String writerProfileImageUrl;   // 작성자 프로필 사진 URL (없으면 null)
    private String content;      // 비밀글이고 볼 권한 없으면 null
    private boolean visible;      // 지금 요청자가 이 content를 볼 수 있는지 (프론트 표시용)

    // JSON 키는 isSecret 유지, 자바 필드명은 secret (Lombok boolean 명명 호환용)
    @JsonProperty("isSecret")
    private boolean secret;

    private boolean canEdit;      // 작성자 본인인지 (수정 버튼 노출 여부)
    private boolean canDelete;    // 작성자 본인 또는 홈피 주인인지 (삭제 버튼 노출 여부)

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
