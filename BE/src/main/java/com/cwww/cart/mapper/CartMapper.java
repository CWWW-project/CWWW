package com.cwww.cart.mapper;

import com.cwww.cart.domain.CartItem;
import com.cwww.cart.dto.CartItemResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CartMapper {

    List<CartItemResponse> selectCartItems(@Param("userId") Long userId);

    int existsCartItem(@Param("userId") Long userId, @Param("itemId") Long itemId);

    int existsCartItemById(@Param("userId") Long userId, @Param("cartId") Long cartId);

    void insertCartItem(CartItem cartItem);

    int deleteCartItem(@Param("userId") Long userId, @Param("cartId") Long cartId);

    void deleteCartItems(@Param("userId") Long userId);
}
