package com.cwww.chat.dto.request;

import com.cwww.chat.domain.ChatRoomType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateChatRoomRequest {
    @NotNull
    private ChatRoomType type;

    @Size(max = 20)
    private String name;

    @NotEmpty
    private List<@NotNull Long> participantUserIds;
}
