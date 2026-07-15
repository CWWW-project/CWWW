package com.cwww.chat.mapper;

import com.cwww.chat.domain.ChatMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatMessageMapper {
    void insert(ChatMessage chatMessage);
    void softDelete(Long messageId);

    ChatMessage findById(Long messageId);
    ChatMessage findLatestVisibleByChatId(Long chatId);

    List<ChatMessage> findByChatIdOrderByCreatedAtAsc(@Param("chatId") Long chatId,
                                                      @Param("beforeMessageId") Long beforeMessageId);

    int countUnreadMessages(@Param("chatId") Long chatId,
                            @Param("lastReadMessageId") Long lastReadMessageId,
                            @Param("userId") Long userId);

    int countUnreadParticipants(@Param("chatId") Long chatId,
                                @Param("messageId") Long messageId,
                                @Param("senderId") Long senderId);
}
