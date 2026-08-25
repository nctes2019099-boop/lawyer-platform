"use client";

import { Suspense, useEffect, useState } from "react";
import { ShieldCheck, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

function ResetPasswordForm() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (t) setToken(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    if (password !== confirm) return setError("كلمتا المرور غير متطابقتين");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "تعذّر إعادة التعيين، الرابط منتهي أو غير صالح");
      }
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-7 shadow-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl brand-emerald flex items-center justify-center text-white mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold">إعادة تعيين كلمة المرور</h1>
          <p className="text-sm text-muted-foreground mt-1">اختر كلمة مرور جديدة لحسابك</p>
        </div>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
            <p className="font-bold mb-1">تم تحديث كلمة المرور</p>
            <p className="text-sm text-muted-foreground mb-5">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
            <a href="/" className="inline-block brand-emerald text-white font-semibold px-6 py-3 rounded-xl">الذهاب لتسجيل الدخول</a>
          </div>
        ) : !token ? (
          <div className="text-center py-6">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="font-bold mb-1">رابط غير صالح</p>
            <p className="text-sm text-muted-foreground mb-5">لا يوجد رمز إعادة تعيين. اطلب رابطاً جديداً من صفحة الدخول.</p>
            <a href="/" className="inline-block brand-emerald text-white font-semibold px-6 py-3 rounded-xl">العودة</a>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted-foreground mb-1 block">كلمة المرور الجديدة</span>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-11"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground mb-1 block">تأكيد كلمة المرور</span>
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </label>
            {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl brand-emerald text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "تحديث كلمة المرور"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
