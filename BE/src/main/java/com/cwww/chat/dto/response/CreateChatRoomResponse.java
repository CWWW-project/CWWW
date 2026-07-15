package com.cwww.chat.dto.response;

import com.cwww.chat.domain.ChatRoom;
import com.cwww.chat.domain.ChatRoomType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateChatRoomResponse {
    private Long chatId;
    private ChatRoomType type;
    private String name;
    private String displayName;

    public static CreateChatRoomResponse from(ChatRoom chatRoom, String displayName) {
        return CreateChatRoomResponse.builder()
                .chatId(chatRoom.getChatId())
                .type(chatRoom.getType())
                .name(chatRoom.getName())
                .displayName(displayName)
                .build();
    }
}
