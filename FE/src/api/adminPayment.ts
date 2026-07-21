// FE/src/api/adminPayment.ts
// 결제 도메인 관리자 API
import { isAxiosError } from 'axios'
import api from './axios'

export interface AdminOrderResponse {
  orderId: number
  orderUid: string
  userId: number
  acornAmount: number
  price: number
  status: string
  createdAt: string
}

export interface AdminOrderDetailResponse {
  orderId: number
  orderUid: string
  userId: number
  acornAmount: number
  price: number
  orderStatus: string
  createdAt: string
  pgTxId: string | null
  method: string | null
  paymentAmount: number | null
  paymentStatus: string | null
  pgStatus: string | null
  failureCode: string | null
  paidAt: string | null
}

export interface PaymentStatsResponse {
  totalChargedAcorn: number
  totalRefundedAcorn: number
  totalSalesAmount: number
  pendingCount: number
  paidCount: number
  cancelingCount: number
  canceledCount: number
}

function toError(e: unknown): Error {
  if (isAxiosError(e)) {
    const data = e.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined
    if (e.response?.status === 403) return new Error('관리자 권한이 필요합니다')
    return new Error(data?.error?.message ?? data?.message ?? '요청에 실패했어요')
  }
  return e instanceof Error ? e : new Error('요청에 실패했어요')
}

// ApiResponse 래핑({data})이든 알몸 DTO든 둘 다 대응
function unwrap<T>(body: unknown): T {
  const b = body as { data?: T }
  return (b?.data ?? body) as T
}

export const adminPaymentApi = {
  async getOrders(status?: string, page = 1, size = 20): Promise<AdminOrderResponse[]> {
    try {
      const params: Record<string, string | number> = { page, size }
      if (status && status !== 'ALL') params.status = status
      const res = await api.get('/admin/payments/orders', { params })
      return unwrap<AdminOrderResponse[]>(res.data)
    } catch (e) { throw toError(e) }
  },

  async getOrderDetail(orderUid: string): Promise<AdminOrderDetailResponse> {
    try {
      const res = await api.get(`/admin/payments/orders/${orderUid}`)
      return unwrap<AdminOrderDetailResponse>(res.data)
    } catch (e) { throw toError(e) }
  },

  async getStats(): Promise<PaymentStatsResponse> {
    try {
      const res = await api.get('/admin/payments/stats')
      return unwrap<PaymentStatsResponse>(res.data)
    } catch (e) { throw toError(e) }
  },

  async resolveCancel(orderUid: string, action: 'COMPLETE' | 'REVERT'): Promise<AdminOrderDetailResponse> {
    try {
      const res = await api.post(`/admin/payments/orders/${orderUid}/resolve-cancel`, { action })
      return unwrap<AdminOrderDetailResponse>(res.data)
    } catch (e) { throw toError(e) }
  },
}