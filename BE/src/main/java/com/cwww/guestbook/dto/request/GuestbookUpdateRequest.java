package com.cwww.guestbook.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 방명록 수정 요청
@Getter
@NoArgsConstructor
public class GuestbookUpdateRequest {

    @NotBlank
    @Size(max = 500)
    private String content;

    /*
    * JSON 키는 isSecret 유지.
    * 자바 필드명은 secret (Lombok/MyBatis boolean 명명 호환용)
    * Boolean(wrapper)이라 안 보내면 null - "값 안 바꿈"으로 처리
     */
    @JsonProperty("isSecret")
    private Boolean secret;

}
