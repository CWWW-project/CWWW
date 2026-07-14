package com.cwww.item.service;

import com.cwww.global.exception.BusinessException;
import com.cwww.global.exception.ErrorCode;
import com.cwww.item.domain.Item;
import com.cwww.item.domain.ItemPurchase;
import com.cwww.item.domain.UserInventory;
import com.cwww.item.dto.InventoryItemResponse;
import com.cwww.item.dto.ItemResponse;
import com.cwww.item.mapper.ItemMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ItemServiceTest {

    @Mock private ItemMapper itemMapper;

    @InjectMocks
    private ItemServiceImpl itemService;

    @Test
    @DisplayName("상점 아이템 목록 조회 성공")
    void getItems_success() {
        // Arrange
        Item item = item(1L, "MINIROOM", "Classic Sofa", 300);
        given(itemMapper.selectItems("MINIROOM")).willReturn(List.of(item));

        // Act
        List<ItemResponse> response = itemService.getItems("MINIROOM");

        // Assert
        assertThat(response).hasSize(1);
        assertThat(response.get(0).getItemId()).isEqualTo(1L);
        assertThat(response.get(0).getName()).isEqualTo("Classic Sofa");
    }

    @Test
    @DisplayName("내 인벤토리 조회 성공")
    void getInventory_success() {
        // Arrange
        InventoryItemResponse inventory = new InventoryItemResponse();
        inventory.setInventoryId(10L);
        inventory.setItemId(1L);
        given(itemMapper.selectInventoryByUserId(1L)).willReturn(List.of(inventory));

        // Act
        List<InventoryItemResponse> response = itemService.getInventory(1L);

        // Assert
        assertThat(response).hasSize(1);
        assertThat(response.get(0).getInventoryId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("아이템 구매 성공")
    void purchaseItem_success() {
        // Arrange
        Item item = item(1L, "MINIROOM", "Classic Sofa", 300);
        given(itemMapper.selectItemById(1L)).willReturn(item);
        given(itemMapper.decreaseAcornBalance(1L, 300)).willReturn(1);
        given(itemMapper.selectAcornBalance(1L)).willReturn(4700);

        // Act
        var response = itemService.purchaseItem(1L, 1L);

        // Assert
        verify(itemMapper).insertItemPurchase(any(ItemPurchase.class));
        verify(itemMapper).insertUserInventory(any(UserInventory.class));
        verify(itemMapper).increaseSalesCount(1L);
        assertThat(response.getRemainingAcorns()).isEqualTo(4700);
    }

    @Test
    @DisplayName("아이템 구매 실패 - 없는 아이템")
    void purchaseItem_itemNotFound() {
        // Arrange
        given(itemMapper.selectItemById(99L)).willReturn(null);

        // Act & Assert
        assertThatThrownBy(() -> itemService.purchaseItem(1L, 99L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    @DisplayName("아이템 구매 실패 - 도토리 부족")
    void purchaseItem_insufficientAcorns() {
        // Arrange
        Item item = item(1L, "MINIROOM", "Classic Sofa", 300);
        given(itemMapper.selectItemById(1L)).willReturn(item);
        given(itemMapper.decreaseAcornBalance(1L, 300)).willReturn(0);

        // Act & Assert
        assertThatThrownBy(() -> itemService.purchaseItem(1L, 1L))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_INPUT);
    }

    private Item item(Long itemId, String category, String name, Integer price) {
        Item item = new Item();
        item.setItemId(itemId);
        item.setCategory(category);
        item.setName(name);
        item.setPrice(price);
        item.setStatus("ACTIVE");
        item.setSalesCount(0);
        return item;
    }
}
