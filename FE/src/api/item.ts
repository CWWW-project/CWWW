import api from './axios'
import type { ApiResponse } from '../types'

export interface Item {
  itemId: number
  category: string
  name: string
  description: string | null
  price: number
  status: string
  salesCount: number | null
  createdAt: string
  updatedAt: string
}

export interface AcornBalance {
  balance: number
  availableBalance: number
}

export interface ItemPurchaseResponse {
  purchasedItems: Item[]
  balance: number
  availableBalance: number
}

export const itemApi = {
  getItems: (page = 1, size = 20) =>
    api.get<ApiResponse<Item[]>>('/items', { params: { page, size } }),

  getInventory: () =>
    api.get<ApiResponse<Item[]>>('/items/inventory'),

  purchaseItems: (itemIds: number[]) =>
    api.post<ApiResponse<ItemPurchaseResponse>>('/items/purchase', { itemIds }),

  getBalance: () =>
    api.get<ApiResponse<AcornBalance>>('/payments/balance'),
}
