// FE/src/pages/pay/AdminPaymentPage.tsx
// 결제 도메인 관리자 대시보드
import { useEffect, useState } from 'react'
import { adminPaymentApi, type AdminOrderResponse, type PaymentStatsResponse } from '../../api/adminPayment'

export default function AdminPaymentPage() {
  const [stats, setStats] = useState<PaymentStatsResponse | null>(null)
  const [orders, setOrders] = useState<AdminOrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [s, o] = await Promise.all([
          adminPaymentApi.getStats(),
          adminPaymentApi.getOrders('ALL', 1, 20),
        ])
        setStats(s)
        setOrders(o)
      } catch (e) {
        setError(e instanceof Error ? e.message : '불러오기 실패')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#89d0ed]">
        <div className="window-frame p-4 text-center">
          <div className="font-[Geist,monospace] text-[14px] text-[#5a4136]">불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#89d0ed]">
        <div className="window-frame p-4 text-center">
          <div className="font-[Geist,monospace] text-[14px] text-[#ba1a1a]">{error || '데이터 로드 실패'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#89d0ed] py-6 px-2">
      <div className="max-w-6xl mx-auto">
        <div className="window-frame p-4 border border-[#8e7164]">
          <div className="retro-title-bar -mx-4 -mt-4 mb-4">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            결제 관리자 대시보드
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <StatCard label="누적 충전" value={`${stats.totalChargedAcorn.toLocaleString()} 🌰`} />
            <StatCard label="누적 환불" value={`${stats.totalRefundedAcorn.toLocaleString()} 🌰`} />
            <StatCard label="총 매출" value={`${stats.totalSalesAmount.toLocaleString()}원`} />
            <StatCard
              label="보정 대기"
              value={String(stats.cancelingCount)}
              highlight={stats.cancelingCount > 0}
            />
          </div>

          {/* 주문 목록 */}
          <div className="window-inset p-2 overflow-x-auto">
            <table className="w-full font-[Geist,monospace] text-[12px]">
              <thead>
                <tr className="text-left text-[#5a4136] border-b-2 border-[#e3bfb1]">
                  <th className="py-1 px-2">주문번호</th>
                  <th className="py-1 px-2">유저</th>
                  <th className="py-1 px-2 text-right">도토리</th>
                  <th className="py-1 px-2">상태</th>
                  <th className="py-1 px-2">날짜</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.orderId} className="border-b border-[#e3bfb1]">
                    <td className="py-1 px-2 truncate max-w-[150px]" title={o.orderUid}>{o.orderUid.slice(0, 12)}…</td>
                    <td className="py-1 px-2">#{o.userId}</td>
                    <td className="py-1 px-2 text-right">{o.acornAmount}</td>
                    <td className="py-1 px-2 font-bold" style={{ color: statusColor(o.status) }}>{o.status}</td>
                    <td className="py-1 px-2 text-[11px]">{o.createdAt?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-4 text-[#5a4136] font-[Geist,monospace] text-[12px]">주문이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="window-frame px-2 py-2" style={highlight ? { borderColor: '#d84a00', background: '#fff3e8' } : undefined}>
      <div className="font-[Geist,monospace] text-[11px] text-[#5a4136]">{label}</div>
      <div className="font-bold text-[14px]" style={{ color: highlight ? '#d84a00' : '#a33e00' }}>{value}</div>
    </div>
  )
}

function statusColor(s: string): string {
  switch (s) {
    case 'PAID': return '#0c6780'
    case 'CANCELING': return '#d84a00'
    case 'CANCELED': return '#888'
    default: return '#5a4136'
  }
}