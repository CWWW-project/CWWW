// FE/src/components/AcornChargeModal.tsx
// 싸이월드 감성 도토리 충전 모달
import { useState } from "react";
import { startCharge } from "../api/payment"; // TODO: 경로 확인

const PACKAGES = [
  { acorn: 100, price: 1000, label: "가볍게 한 줌" },
  { acorn: 500, price: 5000, label: "넉넉하게 한 봉지" },
  { acorn: 1000, price: 10000, label: "다람쥐 부럽지 않게" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AcornChargeModal({ open, onClose }: Props) {
  const [selected, setSelected] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleCharge = async () => {
    if (!localStorage.getItem("accessToken")) {
      setError("로그인이 필요합니다!");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await startCharge(selected); // 성공하면 토스 결제창으로 넘어감
    } catch (e) {
      setError(e instanceof Error ? e.message : "충전 요청에 실패했어요");
      setLoading(false);
    }
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.titleBar}>
          <span>🌰 도토리 충전소</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <p style={S.subtitle}>도토리가 있어야 미니룸을 꾸미죠~ ♪</p>

        <div style={S.packageList}>
          {PACKAGES.map((p) => (
            <button
              key={p.acorn}
              style={{
                ...S.packageCard,
                ...(selected === p.acorn ? S.packageSelected : {}),
              }}
              onClick={() => setSelected(p.acorn)}
            >
              <div style={S.packageAcorn}>🌰 × {p.acorn}</div>
              <div style={S.packageLabel}>{p.label}</div>
              <div style={S.packagePrice}>{p.price.toLocaleString()}원</div>
            </button>
          ))}
        </div>

        {error && <div style={S.error}>⚠ {error}</div>}

        <button style={S.chargeBtn} onClick={handleCharge} disabled={loading}>
          {loading ? "결제창 여는 중..." : "💳 충전하기"}
        </button>
        <p style={S.notice}>테스트 결제 환경이에요. 실제 돈은 나가지 않아요!</p>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  modal: {
    width: 380, background: "#fffdf5", border: "2px solid #4a4a4a",
    borderRadius: 10, boxShadow: "4px 4px 0 rgba(0,0,0,0.25)",
    padding: 0, overflow: "hidden", fontFamily: "inherit",
  },
  titleBar: {
    background: "#aee1f9",
    backgroundImage: "radial-gradient(#ffffff 15%, transparent 16%)",
    backgroundSize: "14px 14px",
    borderBottom: "2px solid #4a4a4a",
    padding: "10px 14px", fontWeight: 800, fontSize: 16,
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  closeBtn: {
    border: "2px solid #4a4a4a", background: "#fff", borderRadius: 6,
    width: 26, height: 26, cursor: "pointer", fontWeight: 700, lineHeight: 1,
  },
  subtitle: { textAlign: "center", margin: "12px 0 4px", color: "#8a6d3b", fontSize: 13 },
  packageList: { display: "flex", flexDirection: "column", gap: 8, padding: "8px 16px" },
  packageCard: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left",
    background: "#fff", border: "2px solid #c9c9c9", borderRadius: 8, fontSize: 14,
  },
  packageSelected: {
    border: "2px solid #ff6600", background: "#fff3e8",
    boxShadow: "2px 2px 0 rgba(255,102,0,0.35)",
  },
  packageAcorn: { fontWeight: 800, minWidth: 90 },
  packageLabel: { color: "#777", fontSize: 12, flex: 1 },
  packagePrice: { fontWeight: 800, color: "#d84a00" },
  error: {
    margin: "4px 16px", padding: "6px 10px", fontSize: 13,
    background: "#ffe9e9", border: "1px solid #e08080", borderRadius: 6, color: "#b03030",
  },
  chargeBtn: {
    display: "block", width: "calc(100% - 32px)", margin: "10px 16px 6px",
    padding: "12px 0", fontSize: 16, fontWeight: 800, cursor: "pointer",
    background: "#ff6600", color: "#fff", border: "2px solid #4a4a4a",
    borderRadius: 8, boxShadow: "3px 3px 0 rgba(0,0,0,0.25)",
  },
  notice: { textAlign: "center", fontSize: 11, color: "#999", margin: "4px 0 14px" },
};