package com.cwww.cart.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CartItem {

    private Long cartId;
    private Long userId;
    private Long itemId;
    private LocalDateTime createdAt;
}
