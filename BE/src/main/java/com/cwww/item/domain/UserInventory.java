package com.cwww.item.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UserInventory {

    private Long id;
    private Long userId;
    private Long itemId;
    private LocalDateTime acquiredAt;
}
