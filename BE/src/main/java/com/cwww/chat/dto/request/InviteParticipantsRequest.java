package com.cwww.chat.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class InviteParticipantsRequest {
    @NotEmpty
    private List<@NotNull Long> participantUserIds;
}
