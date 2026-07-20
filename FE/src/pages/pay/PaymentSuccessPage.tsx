// FE/src/pages/payment/PaymentSuccessPage.tsx
// 토스 결제창 완료 후 돌아오는 페이지 — 자동으로 승인(confirm) 호출
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmPayment, type PaymentConfirmResponse } from "../../api/payment"; // TODO: 경로 확인

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [result, setResult] = useState<PaymentConfirmResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const called = useRef(false); // StrictMode 이중 호출 방지

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const orderUid = params.get("orderId");
    const paymentKey = params.get("paymentKey");
    const amount = Number(params.get("amount"));
    if (!orderUid || !paymentKey || !amount) {
      setStatus("error");
      setErrorMsg("결제 정보가 올바르지 않아요");
      return;
    }
    confirmPayment({ orderUid, paymentKey, amount })
      .then((res) => { setResult(res); setStatus("done"); })
      .catch((e) => { setStatus("error"); setErrorMsg(e.message); });
  }, [params]);

  return (
    <div style={S.page}>
      <div style={S.card}>
        {status === "loading" && (
          <>
            <div style={S.emoji}>⏳</div>
            <h2 style={S.title}>도토리 담는 중...</h2>
            <p style={S.desc}>결제를 확인하고 있어요. 잠시만요~</p>
          </>
        )}
        {status === "done" && result && (
          <>
            <div style={S.emoji}>🌰✨</div>
            <h2 style={S.title}>충전 완료!</h2>
            <p style={S.desc}>
              도토리 <b>{result.chargedAcorn}개</b>가 지갑에 쏙 들어갔어요
            </p>
            <div style={S.balanceBox}>현재 보유 도토리: <b>{result.balance}개</b></div>
            <button style={S.btn} onClick={() => navigate("/shop")}>상점으로 가기</button>
          </>
        )}
        {status === "error" && (
          <>
            <div style={S.emoji}>😢</div>
            <h2 style={S.title}>충전에 실패했어요</h2>
            <p style={S.desc}>{errorMsg}</p>
            <button style={S.btn} onClick={() => navigate("/shop")}>상점으로 돌아가기</button>
          </>
        )}
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
  emoji: { fontSize: 44, marginBottom: 8 },
  title: { margin: "4px 0 8px", fontSize: 22 },
  desc: { color: "#666", fontSize: 14, margin: "0 0 12px" },
  balanceBox: {
    background: "#fff3e8", border: "2px solid #ff6600", borderRadius: 8,
    padding: "10px 0", margin: "8px 0 16px", fontSize: 15,
  },
  btn: {
    padding: "10px 24px", fontSize: 15, fontWeight: 800, cursor: "pointer",
    background: "#ff6600", color: "#fff", border: "2px solid #4a4a4a",
    borderRadius: 8, boxShadow: "3px 3px 0 rgba(0,0,0,0.25)",
  },
};