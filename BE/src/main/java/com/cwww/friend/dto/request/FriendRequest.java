package com.cwww.friend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FriendRequest {

    @NotNull
    @Positive
    private Long receiverId;

    @Size(max = 20)
    private String requesterAlias;

    @Size(max = 20)
    private String receiverAlias;
}
