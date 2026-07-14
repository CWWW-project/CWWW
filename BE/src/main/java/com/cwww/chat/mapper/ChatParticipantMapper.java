package com.cwww.chat.mapper;

import com.cwww.chat.domain.ChatParticipant;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatParticipantMapper {
    void insert(ChatParticipant participant);
    void updateLastReadMessageId(@Param("chatId") Long chatId,
                                 @Param("userId") Long userId,
                                 @Param("lastReadMessageId") Long lastReadMessageId);
    void updateLeftAt(@Param("chatId") Long chatId,
                      @Param("userId") Long userId);
    void reactivateParticipant(@Param("chatId") Long chatId,
                               @Param("userId") Long userId);

    List<ChatParticipant> findByUserId(Long userId);
    List<ChatParticipant> findByChatId(Long chatId);
    ChatParticipant findByChatIdAndUserId(@Param("chatId") Long chatId,
                                          @Param("userId") Long userId);
    ChatParticipant findAnyByChatIdAndUserId(@Param("chatId") Long chatId,
                                             @Param("userId") Long userId);
}
