package com.cwww.cart.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CartAddRequest {

    @NotNull
    private Long itemId;
}
