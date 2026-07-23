package com.cwww.chat.dto.request;

import com.cwww.chat.domain.MessageType;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ChatMessageRequest {
    private Long chatId;
    private String content;
    private MessageType messageType;
    private List<String> mediaUrls;
}
