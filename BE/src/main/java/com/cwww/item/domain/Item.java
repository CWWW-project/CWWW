package com.cwww.item.domain;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class Item {

    private Long itemId;
    private String category;
    private String name;
    private String description;
    private Integer price;
    private String status;
    private String rejectReason;
    private Integer salesCount;
    private Long creatorId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}