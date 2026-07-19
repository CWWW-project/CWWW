package com.cwww.global.config;

import com.cwww.chat.redis.ChatListSubscriber;
import com.cwww.chat.redis.ChatMessageSubscriber;
import com.cwww.chat.redis.ChatNotificationSubscriber;
import com.cwww.global.notification.redis.NotificationSubscriber;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@RequiredArgsConstructor
public class RedisConfig {
    private final RedisConnectionFactory redisConnectionFactory;
    private final ChatMessageSubscriber chatMessageSubscriber;
    private final ChatListSubscriber chatListSubscriber;
    private final ChatNotificationSubscriber chatNotificationSubscriber;
    private final NotificationSubscriber notificationSubscriber;

    @Bean
    public ChannelTopic chatMessageTopic(){
        return new ChannelTopic("chat.message");
    }
    @Bean
    public ChannelTopic chatListTopic(){
        return new ChannelTopic("chat.list");
    }
    @Bean
    public ChannelTopic notificationTopic() {
        return new ChannelTopic("notification");
    }

    @Bean
    public MessageListenerAdapter messageListenerAdapter(){
        return new MessageListenerAdapter(chatMessageSubscriber, "onMessage");
    }
    @Bean
    public MessageListenerAdapter chatListListenerAdapter() {
        return new MessageListenerAdapter(chatListSubscriber, "onMessage");
    }
    @Bean
    public MessageListenerAdapter chatNotificationListenerAdapter() {
        return new MessageListenerAdapter(chatNotificationSubscriber, "onMessage");
    }
    @Bean
    public MessageListenerAdapter notificationListenerAdapter() {
        return new MessageListenerAdapter(notificationSubscriber, "onMessage");
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            @Qualifier("messageListenerAdapter") MessageListenerAdapter messageListenerAdapter,
            @Qualifier("chatListListenerAdapter") MessageListenerAdapter chatListListenerAdapter,
            @Qualifier("chatNotificationListenerAdapter") MessageListenerAdapter chatNotificationSubscriber,
            @Qualifier("notificationListenerAdapter") MessageListenerAdapter notificationListenerAdapter,
            @Qualifier("chatMessageTopic") ChannelTopic chatMessageTopic,
            @Qualifier("chatListTopic") ChannelTopic chatListTopic,
            @Qualifier("notificationTopic") ChannelTopic notificationTopic
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(redisConnectionFactory);
        container.addMessageListener(messageListenerAdapter, chatMessageTopic);
        container.addMessageListener(chatNotificationSubscriber, chatMessageTopic);
        container.addMessageListener(chatListListenerAdapter, chatListTopic);
        container.addMessageListener(notificationListenerAdapter, notificationTopic);
        return container;
    }

    @Bean
    public RedisTemplate<String, String> redisTemplate() {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        return template;
    }
}
