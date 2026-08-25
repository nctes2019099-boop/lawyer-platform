"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, background: "#f4f6f5", fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ maxWidth: 420, textAlign: "center", background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: "#059669" }}>⚠️</div>
            <h1 style={{ fontSize: 20, margin: "8px 0" }}>حدث خطأ غير متوقع</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
              {error?.message || "تعذّر تحميل الصفحة. حاول مرة أخرى."}
            </p>
            <button
              onClick={reset}
              style={{ background: "#10b981", color: "#fff", border: "none", padding: "12px 28px", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
