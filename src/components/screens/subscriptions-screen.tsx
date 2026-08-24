"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Check, X, CreditCard, Smartphone, ShieldCheck, Sparkles,
  CalendarClock, RefreshCw, Ban, Clock, CheckCircle2, XCircle, Loader2,
  History,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatIQD, getRelativeTime } from "@/lib/utils";
import { toast } from "react-hot-toast";

const methods = [
  { key: "card", label: "بطاقة مصرفية", icon: CreditCard, desc: "Visa / Mastercard" },
  { key: "zaincash", label: "زين كاش", icon: Smartphone, desc: "محفظة إلكترونية" },
  { key: "mock", label: "دفع تجريبي", icon: ShieldCheck, desc: "للتجربة فقط" },
] as const;

export function SubscriptionsScreen() {
  const { goBack } = useAppStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // payment flow
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [method, setMethod] = useState<(typeof methods)[number]["key"]>("card");
  const [paying, setPaying] = useState(false);
  const [status, setStatus] = useState<null | { kind: "success" | "failed"; planName?: string; ref?: string }>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    fetch("/api/subscriptions/plans").then((r) => r.json()).then((d) => setPlans(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/subscriptions/current").then((r) => r.json()).then((d) => setCurrent(d.subscription)).catch(() => {});
    fetch("/api/subscriptions/payments").then((r) => r.json()).then((d) => setPayments(d.payments || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startPayment = (plan: any) => { setSelectedPlan(plan); setStatus(null); };

  const confirmPayment = async () => {
    if (!selectedPlan) return;
    setPaying(true);
    try {
      const res = await fetch("/api/subscriptions/create-payment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id, paymentMethod: method }),
      });
      if (!res.ok) throw new Error();
      const payment = await res.json();

      // Mock provider: complete immediately; zaincash: simulate processing.
      await new Promise((r) => setTimeout(r, method === "zaincash" ? 1400 : 700));

      const verifyRes = await fetch("/api/subscriptions/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.paymentId }),
      });
      if (!verifyRes.ok) throw new Error();

      setStatus({ kind: "success", planName: selectedPlan.name, ref: payment.transactionId });
      load();
    } catch {
      setStatus({ kind: "failed" });
    }
    setPaying(false);
  };

  const cancelAutoRenew = async () => {
    setCancelling(true);
    const res = await fetch("/api/subscriptions/cancel-auto-renew", { method: "POST" });
    setCancelling(false);
    if (res.ok) { toast.success("تم إيقاف التجديد التلقائي"); load(); }
    else toast.error("فشل الإيقاف");
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const totalPaid = payments.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="max-w-lg mx-auto p-4 pb-28">
      <div className="flex items-center justify-between mb-4">
        <button onClick={goBack} className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center"><X className="w-5 h-5" /></button>
        <h2 className="text-sm font-bold">الاشتراكات والدفع</h2>
        <button onClick={() => setShowHistory(true)} className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center"><History className="w-4 h-4" /></button>
      </div>

      {/* Current subscription */}
      {current ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="brand-emerald rounded-3xl p-5 text-white mb-5 shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full bg-white/10" />
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">خطتك الحالية</span>
          </div>
          <h3 className="text-xl font-extrabold">{current.plan?.name || "خطة"}</h3>
          <p className="text-[11px] opacity-90 mt-0.5">{current.status === "ACTIVE" ? "اشتراك نشط" : current.status}</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
              <p className="text-[10px] opacity-80 flex items-center gap-1"><CalendarClock className="w-3 h-3" /> ينتهي في</p>
              <p className="text-sm font-bold mt-0.5">{current.endDate ? new Date(current.endDate).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "—"}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
              <p className="text-[10px] opacity-80 flex items-center gap-1"><Clock className="w-3 h-3" /> متبقٍ</p>
              <p className="text-sm font-bold mt-0.5">{Math.max(0, current.daysRemaining ?? 0)} يوم</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20">
            <span className="text-[11px] flex items-center gap-1">
              {current.autoRenew ? <><span className="w-2 h-2 rounded-full bg-white animate-pulse" /> تجديد تلقائي مفعّل</> : <><Ban className="w-3 h-3" /> تجديد تلقائي متوقف</>}
            </span>
            {current.autoRenew && (
              <button onClick={cancelAutoRenew} disabled={cancelling} className="text-[11px] bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-60">{cancelling ? "..." : "إيقاف التجديد"}</button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="legal-card rounded-2xl p-4 mb-5 text-center border-2 border-dashed border-primary/30">
          <Sparkles className="w-8 h-8 mx-auto text-primary mb-2" />
          <p className="text-sm font-bold">لا يوجد اشتراك نشط</p>
          <p className="text-[11px] text-muted-foreground mt-1">اختر خطة لتفعيل جميع المميزات</p>
        </div>
      )}

      {/* Plans */}
      <div className="space-y-3">
        {plans.map((p, i) => {
          const features = (p.features || "").split(/[,،\n]/).map((s: string) => s.trim()).filter(Boolean);
          const isCurrent = current?.planId === p.id;
          const highlight = i === 1;
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`legal-card rounded-2xl p-5 relative ${highlight ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""}`}>
              {highlight && <span className="absolute -top-2.5 right-4 brand-emerald text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">الأكثر شيوعاً</span>}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-extrabold text-base">{p.name}</h3>
                  {p.description && <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px]">{p.description}</p>}
                </div>
                <ShieldCheck className={`w-6 h-6 ${highlight ? "text-primary" : "text-muted-foreground/40"}`} />
              </div>
              <div className="flex items-baseline gap-1 my-3">
                <span className="text-2xl font-extrabold number-magnify text-primary">{formatIQD(p.price)}</span>
                <span className="text-[11px] text-muted-foreground">/ {p.durationDays} يوم</span>
              </div>
              {features.length > 0 && (
                <ul className="space-y-1.5 mb-4">
                  {features.slice(0, 6).map((f: string, fi: number) => (
                    <li key={fi} className="flex items-center gap-2 text-xs"><Check className="w-3.5 h-3.5 text-primary shrink-0" /><span>{f}</span></li>
                  ))}
                </ul>
              )}
              {isCurrent ? (
                <button disabled className="w-full py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold flex items-center justify-center gap-2"><Check className="w-4 h-4" /> اشتراكك الحالي</button>
              ) : (
                <button onClick={() => startPayment(p)} className="w-full py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold">اشترك الآن</button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Payment method / status sheet */}
      <AnimatePresence>
        {selectedPlan && !status && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !paying && setSelectedPlan(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-sm p-5">
              <h3 className="font-bold mb-1">طريقة الدفع</h3>
              <p className="text-[11px] text-muted-foreground mb-4">{selectedPlan.name} — {formatIQD(selectedPlan.price)}</p>
              <div className="space-y-2 mb-4">
                {methods.map((m) => (
                  <button key={m.key} onClick={() => setMethod(m.key)} disabled={paying} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-right disabled:opacity-60 ${method === m.key ? "border-primary bg-primary/5" : "border-border"}`}>
                    <m.icon className="w-5 h-5 text-primary" />
                    <span className="flex-1"><span className="block text-sm font-semibold">{m.label}</span><span className="block text-[10px] text-muted-foreground">{m.desc}</span></span>
                    <span className={`w-4 h-4 rounded-full border-2 ${method === m.key ? "border-primary bg-primary" : "border-muted"}`} />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedPlan(null)} disabled={paying} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm">إلغاء</button>
                <button onClick={confirmPayment} disabled={paying} className="flex-1 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                  {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الدفع...</> : "ادفع الآن"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status dialog */}
      <AnimatePresence>
        {status && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={() => setStatus(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 text-center">
              {status.kind === "success" ? (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3"><CheckCircle2 className="w-9 h-9 text-emerald-600" /></div>
                  <h3 className="text-lg font-bold mb-1">تم الدفع بنجاح!</h3>
                  <p className="text-sm text-muted-foreground mb-1">تم تفعيل {status.planName}.</p>
                  {status.ref && <p className="text-[10px] text-muted-foreground/60 mb-4" dir="ltr">Ref: {status.ref}</p>}
                  <button onClick={() => { setStatus(null); setSelectedPlan(null); load(); }} className="w-full py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold">تم</button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 flex items-center justify-center mb-3"><XCircle className="w-9 h-9 text-rose-600" /></div>
                  <h3 className="text-lg font-bold mb-1">فشل الدفع</h3>
                  <p className="text-sm text-muted-foreground mb-4">حاول مرة أخرى أو استخدم طريقة دفع مختلفة.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setStatus(null)} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm">إغلاق</button>
                    <button onClick={() => { setStatus(null); }} className="flex-1 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold">إعادة المحاولة</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History sheet */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowHistory(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><History className="w-4 h-4" /> سجل المدفوعات</h3>
                <button onClick={() => setShowHistory(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4">
                {totalPaid > 0 && (
                  <div className="legal-card rounded-xl p-3 mb-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">إجمالي المدفوعات</span>
                    <span className="text-base font-extrabold text-emerald-600 number-magnify">{formatIQD(totalPaid)}</span>
                  </div>
                )}
                {payments.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-10">لا توجد مدفوعات</p>
                ) : (
                  <div className="space-y-2.5">
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${p.status === "COMPLETED" ? "bg-emerald-100 text-emerald-600" : p.status === "FAILED" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}>
                          {p.status === "COMPLETED" ? <CheckCircle2 className="w-4 h-4" /> : p.status === "FAILED" ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold">{p.plan?.name || "دفع"}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{p.provider === "zaincash" ? "زين كاش" : p.provider === "card" ? "بطاقة" : "تجريبي"}</span>
                            <span>•</span>
                            <span>{new Date(p.createdAt).toLocaleDateString("ar-EG")}</span>
                            <span>•</span>
                            <span>{getRelativeTime(p.createdAt)}</span>
                          </p>
                        </div>
                        <div className="text-left shrink-0">
                          <p className="text-sm font-extrabold number-magnify">{formatIQD(p.amount)}</p>
                          <p className={`text-[9px] font-semibold ${p.status === "COMPLETED" ? "text-emerald-600" : p.status === "FAILED" ? "text-rose-600" : "text-amber-600"}`}>{p.status === "COMPLETED" ? "مكتمل" : p.status === "FAILED" ? "فاشل" : "معلق"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
