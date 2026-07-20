package com.cwww.guestbook.service;

import com.cwww.global.notification.dto.NotificationEvent;
import com.cwww.global.notification.redis.RedisNotificationPublisher;
import com.cwww.guestbook.domain.Guestbook;
import com.cwww.guestbook.dto.request.GuestbookCreateRequest;
import com.cwww.guestbook.mapper.GuestbookMapper;
import com.cwww.user.mapper.UserMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class GuestbookServiceTest {

    @Mock private GuestbookMapper guestbookMapper;
    @Mock private UserMapper userMapper;
    @Mock private RedisNotificationPublisher notificationPublisher;

    @InjectMocks
    private GuestbookService guestbookService;

    @Test
    @DisplayName("방명록 작성 성공 시 홈피 주인에게 알림 발행")
    void createGuestbook_publishesNotification() {
        Long ownerId = 1L;
        Long writerId = 2L;
        GuestbookCreateRequest request = new GuestbookCreateRequest();
        ReflectionTestUtils.setField(request, "content", "방명록 내용");
        ReflectionTestUtils.setField(request, "secret", true);

        given(guestbookMapper.selectMinihompyIdByOwnerId(ownerId)).willReturn(10L);
        given(userMapper.findNicknameById(writerId)).willReturn("방문자");
        doAnswer(invocation -> {
            Guestbook guestbook = invocation.getArgument(0);
            guestbook.setGuestbookId(100L);
            return 1;
        }).when(guestbookMapper).insertGuestbook(org.mockito.ArgumentMatchers.any(Guestbook.class));

        guestbookService.createGuestbook(ownerId, writerId, request);

        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(notificationPublisher).publish(eventCaptor.capture());

        NotificationEvent event = eventCaptor.getValue();
        assertThat(event.getEventType()).isEqualTo("GUESTBOOK_CREATED");
        assertThat(event.getTargetUserId()).isEqualTo(ownerId);
        assertThat(event.getActorId()).isEqualTo(writerId);
        assertThat(event.getActorName()).isEqualTo("방문자");
        assertThat(event.getTargetId()).isEqualTo(100L);
        assertThat(event.getTargetType()).isEqualTo("GUESTBOOK");
        assertThat(event.getPreview()).isEqualTo("방문자님이 방명록을 남겼습니다.");
    }
}
