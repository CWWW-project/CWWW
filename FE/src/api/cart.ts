import api from './axios'
import type { ApiResponse, CartItemResponse, CartPurchaseResponse } from '../types'

export const cartApi = {
  getCart: () =>
    api.get<ApiResponse<CartItemResponse[]>>('/carts'),

  addItem: (itemId: number) =>
    api.post<ApiResponse<CartItemResponse[]>>('/carts', { itemId }),

  removeItem: (cartItemId: number) =>
    api.delete<ApiResponse<void>>(`/carts/${cartItemId}`),

  clear: () =>
    api.delete<ApiResponse<void>>('/carts'),

  purchase: () =>
    api.post<ApiResponse<CartPurchaseResponse>>('/carts/purchase'),
}
