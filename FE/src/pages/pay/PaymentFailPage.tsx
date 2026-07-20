// FE/src/pages/payment/PaymentFailPage.tsx
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentFailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🐿️💦</div>
        <h2 style={{ margin: "4px 0 8px" }}>결제가 취소됐어요</h2>
        <p style={{ color: "#666", fontSize: 13 }}>
          {params.get("message") ?? "결제창에서 취소되었거나 오류가 발생했어요"}
        </p>
        <button style={S.btn} onClick={() => navigate("/shop")}>상점으로 돌아가기</button>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#aee1f9",
    backgroundImage: "radial-gradient(#ffffff 15%, transparent 16%)",
    backgroundSize: "18px 18px",
  },
  card: {
    width: 360, textAlign: "center", background: "#fffdf5",
    border: "2px solid #4a4a4a", borderRadius: 12,
    boxShadow: "5px 5px 0 rgba(0,0,0,0.25)", padding: "32px 24px",
  },
  btn: {
    marginTop: 12, padding: "10px 24px", fontSize: 15, fontWeight: 800, cursor: "pointer",
    background: "#ff6600", color: "#fff", border: "2px solid #4a4a4a",
    borderRadius: 8, boxShadow: "3px 3px 0 rgba(0,0,0,0.25)",
  },
};