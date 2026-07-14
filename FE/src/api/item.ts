import api from './axios'
import type { ApiResponse, InventoryItemResponse, ItemResponse, PurchaseResponse } from '../types'

export const itemApi = {
  getItems: (category?: string) =>
    api.get<ApiResponse<ItemResponse[]>>('/items', { params: { category } }),

  getInventory: () =>
    api.get<ApiResponse<InventoryItemResponse[]>>('/inventory/me'),

  purchaseItem: (itemId: number) =>
    api.post<ApiResponse<PurchaseResponse>>(`/items/${itemId}/purchase`),
}
