package com.cwww.chat.mapper;

import com.cwww.chat.domain.ChatRoom;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatRoomMapper {
    void insert(ChatRoom chatRoom);
    ChatRoom findById(Long chatId);
    void updateLastMessage(@Param("chatId") Long chatId,
                           @Param("lastMessageId") Long lastMessageId);
    void updateLastMessageForDelete(@Param("chatId") Long chatId,
                                    @Param("lastMessageId") Long lastMessageId);

    //전체 채팅방 목록을 최신 업데이트 순으로 조회할 때 사용
    List<ChatRoom> findAllOrderByUpdatedAtDesc();
}
