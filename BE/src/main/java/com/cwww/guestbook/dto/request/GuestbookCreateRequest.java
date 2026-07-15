package com.cwww.guestbook.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class GuestbookCreateRequest {

    @NotBlank
    @Size(max = 500)
    private String content;

    // JSON 키는 isSecret 유지, 자바 필드명은 secret (Lombok/MyBatis boolean 명명 호환용)
    @JsonProperty("isSecret")
    private boolean secret;

}
