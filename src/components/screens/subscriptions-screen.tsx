"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Check, X, CreditCard, Smartphone, ShieldCheck, Sparkles,
  CalendarClock, RefreshCw, Ban,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatIQD } from "@/lib/utils";
import { toast } from "react-hot-toast";

const methods = [
  { key: "mock", label: "تجريبي", icon: CreditCard },
  { key: "card", label: "بطاقة", icon: CreditCard },
  { key: "zaincash", label: "زين كاش", icon: Smartphone },
] as const;

export function SubscriptionsScreen() {
  const { navigate, goBack } = useAppStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [method, setMethod] = useState<(typeof methods)[number]["key"]>("mock");
  const [showMethods, setShowMethods] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    fetch("/api/subscriptions/plans").then((r) => r.json()).then((d) => setPlans(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/subscriptions/current").then((r) => r.json()).then((d) => setCurrent(d.subscription)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const subscribe = async (planId: string) => {
    setPaying(planId);
    try {
      const res = await fetch("/api/subscriptions/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, paymentMethod: method }),
      });
      if (res.ok) {
        toast.success("تم الاشتراك بنجاح");
        setShowMethods(null);
        load();
      } else {
        const e = await res.json().catch(() => ({}));
        toast.error(e.error || "فشل الدفع");
      }
    } catch {
      toast.error("فشل الدفع");
    }
    setPaying(null);
  };

  const cancelAutoRenew = async () => {
    setCancelling(true);
    const res = await fetch("/api/subscriptions/cancel-auto-renew", { method: "POST" });
    setCancelling(false);
    if (res.ok) { toast.success("تم إيقاف التجديد التلقائي"); load(); }
    else toast.error("فشل الإيقاف");
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg mx-auto p-4 pb-28">
      <div className="flex items-center justify-between mb-4">
        <button onClick={goBack} className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center"><X className="w-5 h-5" /></button>
        <h2 className="text-sm font-bold">الاشتراكات</h2>
        <div className="w-10" />
      </div>

      {/* Current subscription */}
      {current ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="brand-emerald rounded-3xl p-5 text-white mb-5 shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full bg-white/10" />
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">اشتراكك الحالي</span>
          </div>
          <h3 className="text-xl font-extrabold">{current.plan?.name || "خطة"}</h3>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
              <p className="text-[10px] opacity-80 flex items-center gap-1"><CalendarClock className="w-3 h-3" /> ينتهي في</p>
              <p className="text-sm font-bold mt-0.5">{current.endDate ? new Date(current.endDate).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "—"}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 backdrop-blur">
              <p className="text-[10px] opacity-80 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> متبقٍ</p>
              <p className="text-sm font-bold mt-0.5">{current.daysRemaining ?? 0} يوم</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20">
            <span className="text-[11px] flex items-center gap-1">
              {current.autoRenew ? <><span className="w-2 h-2 rounded-full bg-white" /> تجديد تلقائي مفعّل</> : <Ban className="w-3 h-3" /> تجديد تلقائي متوقف}
            </span>
            {current.autoRenew && (
              <button onClick={cancelAutoRenew} disabled={cancelling} className="text-[11px] bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-60">
                {cancelling ? "..." : "إيقاف التجديد"}
              </button>
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
          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`legal-card rounded-2xl p-5 relative ${i === 1 ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""}`}>
              {i === 1 && <span className="absolute -top-2.5 right-4 brand-emerald text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">الأكثر شيوعاً</span>}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-extrabold text-base">{p.name}</h3>
                  {p.description && <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px]">{p.description}</p>}
                </div>
                <ShieldCheck className={`w-6 h-6 ${i === 1 ? "text-primary" : "text-muted-foreground/40"}`} />
              </div>
              <div className="flex items-baseline gap-1 my-3">
                <span className="text-2xl font-extrabold number-magnify text-primary">{formatIQD(p.price)}</span>
                <span className="text-[11px] text-muted-foreground">/ {p.durationDays} يوم</span>
              </div>
              {features.length > 0 && (
                <ul className="space-y-1.5 mb-4">
                  {features.slice(0, 6).map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              {isCurrent ? (
                <button disabled className="w-full py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold flex items-center justify-center gap-2"><Check className="w-4 h-4" /> اشتراكك الحالي</button>
              ) : (
                <button onClick={() => { setMethod("mock"); setShowMethods(p.id); }} className="w-full py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold">اشترك الآن</button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Payment method sheet */}
      <AnimatePresence>
        {showMethods && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowMethods(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-sm p-5">
              <h3 className="font-bold mb-1">طريقة الدفع</h3>
              <p className="text-[11px] text-muted-foreground mb-4">اختر طريقة الدفع لإتمام الاشتراك</p>
              <div className="space-y-2 mb-4">
                {methods.map((m) => (
                  <button key={m.key} onClick={() => setMethod(m.key)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${method === m.key ? "border-primary bg-primary/5" : "border-border"}`}>
                    <m.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold flex-1 text-right">{m.label}</span>
                    <span className={`w-4 h-4 rounded-full border-2 ${method === m.key ? "border-primary bg-primary" : "border-muted"}`} />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowMethods(null)} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm">إلغاء</button>
                <button onClick={() => subscribe(showMethods)} disabled={!!paying} className="flex-1 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold disabled:opacity-70">
                  {paying ? "جارٍ الدفع..." : "ادفع الآن"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
