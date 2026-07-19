import api from './axios'
import type { ApiResponse, InventoryItemResponse, ItemResponse, PurchaseResponse } from '../types'

export const itemApi = {
  getItems: (category?: string, page = 1, size = 100) =>
    api.get<ApiResponse<ItemResponse[]>>('/items', { params: { category, page, size } }),

  getItem: (itemId: number) =>
    api.get<ApiResponse<ItemResponse>>(`/items/${itemId}`),

  getInventory: (category?: string) =>
    api.get<ApiResponse<InventoryItemResponse[]>>('/items/me', { params: { category } }),

  purchaseItem: (itemId: number) =>
    api.post<ApiResponse<PurchaseResponse>>(`/items/${itemId}/purchase`),
}
