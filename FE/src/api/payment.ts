// FE/src/api/payment.ts
// 결제(도토리 충전) API — 팀 axios 인스턴스 사용
import { isAxiosError } from 'axios'
import api from './axios'
import type { ApiResponse } from '../types'

// ⚠️ 마지막 TODO: 토스 "클라이언트 키" (test_ck_ 시작). 시크릿 키(test_sk_) 금지!
export const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY

export interface OrderCreateResponse {
  orderUid: string
  acornAmount: number
  price: number
}

export interface PaymentConfirmResponse {
  orderUid: string
  chargedAcorn: number
  balance: number
}

export interface PaymentCancelResponse {
  orderUid: string
  refundedAcorn: number
  balance: number
}

// 서버 에러 메시지를 사람이 읽을 Error로 변환
function toError(e: unknown): Error {
  if (isAxiosError(e)) {
    const data = e.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined
    return new Error(data?.error?.message ?? data?.message ?? '요청에 실패했어요')
  }
  return e instanceof Error ? e : new Error('요청에 실패했어요')
}

// ApiResponse에서 실제 데이터 꺼내기
// ⚠️ types의 ApiResponse에서 데이터 필드명이 data가 아니면 여기 한 곳만 수정
function unwrap<T>(body: ApiResponse<T>): T {
  return (body as { data: T }).data
}

export async function createOrder(acornAmount: number): Promise<OrderCreateResponse> {
  try {
    const res = await api.post<ApiResponse<OrderCreateResponse>>('/payments/orders', { acornAmount })
    return unwrap(res.data)
  } catch (e) {
    throw toError(e)
  }
}

export async function confirmPayment(params: {
  orderUid: string
  paymentKey: string
  amount: number
}): Promise<PaymentConfirmResponse> {
  try {
    const res = await api.post<ApiResponse<PaymentConfirmResponse>>('/payments/confirm', params)
    return unwrap(res.data)
  } catch (e) {
    throw toError(e)
  }
}

export async function cancelPayment(orderUid: string, reason: string): Promise<PaymentCancelResponse> {
  try {
    const res = await api.post<ApiResponse<PaymentCancelResponse>>('/payments/cancel', { orderUid, reason })
    return unwrap(res.data)
  } catch (e) {
    throw toError(e)
  }
}   // ← cancelPayment는 여기서 끝. 이 중괄호 "밖"이 추가 위치예요

export interface AcornBalanceResponse {
  balance: number
}

export async function getBalance(): Promise<AcornBalanceResponse> {
  try {
    const res = await api.get<ApiResponse<AcornBalanceResponse>>('/payments/balance')
    return unwrap(res.data)
  } catch (e) {
    throw toError(e)
  }
}


// ── 토스 SDK (v1) 동적 로드 ─────────────────────────────
declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>
    }
  }
}

 let tossSdkPromise: Promise<void> | null = null

export function loadTossSdk(): Promise<void> {
  // 이미 SDK가 로드되어 있다면 바로 완료 처리
  if (window.TossPayments) {
    return Promise.resolve()
  }

  // 이미 SDK 로딩 중이라면 기존 Promise 반환
  if (tossSdkPromise) {
    return tossSdkPromise
  }

  // 최초 한 번만 SDK 스크립트 생성
  tossSdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')

    script.src = 'https://js.tosspayments.com/v1/payment'

    script.onload = () => resolve()

    script.onerror = () => {
      tossSdkPromise = null
      reject(new Error('토스 SDK 로드 실패'))
    }

    document.head.appendChild(script)
  })

  return tossSdkPromise
}
/** 주문 생성 → 토스 결제창 열기 (완료되면 /payment/success 로 돌아옴) */
export async function startCharge(acornAmount: number) {
  const order = await createOrder(acornAmount)
  await loadTossSdk()
  const toss = window.TossPayments!(TOSS_CLIENT_KEY)
  await toss.requestPayment('카드', {
    amount: order.price,
    orderId: order.orderUid,
    orderName: `도토리 ${order.acornAmount}개`,
    successUrl: `${window.location.origin}/payment/success`,
    failUrl: `${window.location.origin}/payment/fail`,
  })
}
