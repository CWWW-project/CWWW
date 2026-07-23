package com.cwww.global.config;

import com.cwww.auth.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {
    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authorization = accessor.getFirstNativeHeader("Authorization");

            if (authorization == null || !authorization.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing Authorization header");
            }

            String token = authorization.substring(7);
            jwtUtil.validateToken(token);

            Long userId = jwtUtil.getUserId(token);
            String role = jwtUtil.getRole(token);

            var authorities = role != null
                    ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    : List.<SimpleGrantedAuthority>of();

            Authentication authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, authorities);

            accessor.setUser(authentication);
            accessor.setLeaveMutable(true);
        }

        return message;
    }
}
