package com.cwww.friend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FriendAliasRequest {

    @NotBlank
    @Size(max = 20)
    private String alias;
}
