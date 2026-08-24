"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, CreditCard, Briefcase, Package, Plus, Pencil,
  Trash2, X, Check, Crown, Ban,
} from "lucide-react";
import { formatIQD } from "@/lib/utils";
import { toast } from "react-hot-toast";

const tabs = [
  { key: "overview", label: "نظرة عامة", icon: Shield },
  { key: "payments", label: "المدفوعات", icon: CreditCard },
  { key: "plans", label: "خطط الاشتراك", icon: Package },
] as const;
type TabKey = (typeof tabs)[number]["key"];

const emptyPlan = { name: "", description: "", price: "", durationDays: "30", features: "", isActive: true, sortOrder: 0 };

export function AdminScreen() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [stats, setStats] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/stats").then((r) => { if (r.status === 403) setForbidden(true); return r.json(); }).then((d) => setStats(d)).catch(() => {});
    fetch("/api/admin/payments").then((r) => r.json()).then((d) => setPayments(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/admin/subscription-plans").then((r) => r.json()).then((d) => setPlans(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (forbidden) {
    return (
      <div className="max-w-lg mx-auto p-4 text-center py-20">
        <Shield className="w-16 h-16 mx-auto mb-4 text-destructive/40" />
        <h2 className="text-lg font-bold mb-1">وصول محظور</h2>
        <p className="text-sm text-muted-foreground">هذه اللوحة للمسؤولين فقط.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 pb-28">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20"><Crown className="w-5 h-5 text-white" /></div>
        <div><h2 className="text-lg font-extrabold">لوحة الإدارة</h2><p className="text-[11px] text-muted-foreground">إدارة النظام والاشتراكات</p></div>
      </div>

      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-4">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition-all ${tab === t.key ? "brand-emerald text-white shadow" : "text-muted-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="h-40 rounded-2xl bg-secondary/50 animate-pulse" /> : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {tab === "overview" && <Overview stats={stats} payments={payments} />}
            {tab === "payments" && <Payments payments={payments} />}
            {tab === "plans" && <Plans plans={plans} reload={load} />}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function Overview({ stats, payments }: { stats: any; payments: any[] }) {
  const revenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const cards = [
    { label: "المستخدمون", value: stats?.totalUsers || 0, icon: Users, color: "text-sky-600", bg: "bg-sky-500" },
    { label: "القضايا", value: stats?.totalCases || 0, icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-500" },
    { label: "الاشتراكات", value: stats?.totalSubscriptions || 0, icon: Package, color: "text-purple-600", bg: "bg-purple-500" },
    { label: "المدفوعات", value: stats?.totalPayments || 0, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-500" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="legal-card rounded-2xl p-4 relative overflow-hidden">
            <span className={`absolute top-0 right-0 w-1 h-full ${c.bg}`} />
            <div className="pr-1.5">
              <c.icon className={`w-5 h-5 mb-2 ${c.color}`} />
              <p className="text-2xl font-extrabold number-magnify">{c.value}</p>
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="legal-card rounded-2xl p-4">
        <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
        <p className="text-2xl font-extrabold text-emerald-600 number-magnify mt-1">{formatIQD(revenue)}</p>
      </div>
    </div>
  );
}

function Payments({ payments }: { payments: any[] }) {
  if (!payments.length) return <div className="text-center py-12 text-sm text-muted-foreground">لا توجد مدفوعات</div>;
  return (
    <div className="space-y-2.5">
      {payments.slice(0, 50).map((p) => (
        <div key={p.id} className="legal-card rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><CreditCard className="w-4 h-4" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{p.user?.name || p.user?.email || "مستخدم"}</p>
            <p className="text-[10px] text-muted-foreground">{p.method || "—"} • {new Date(p.createdAt).toLocaleDateString("ar-EG")}</p>
          </div>
          <p className="text-sm font-extrabold text-emerald-600 number-magnify">{formatIQD(p.amount)}</p>
        </div>
      ))}
    </div>
  );
}

function Plans({ plans, reload }: { plans: any[]; reload: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyPlan });
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditId(null); setForm({ ...emptyPlan }); setShowForm(true); };
  const openEdit = (p: any) => { setEditId(p.id); setForm({ name: p.name, description: p.description || "", price: String(p.price), durationDays: String(p.durationDays), features: p.features || "", isActive: p.isActive, sortOrder: p.sortOrder || 0 }); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim()) return toast.error("اسم الخطة مطلوب");
    setSaving(true);
    const payload = { name: form.name, description: form.description, price: Number(form.price) || 0, durationDays: Number(form.durationDays) || 30, features: form.features, isActive: form.isActive, sortOrder: form.sortOrder };
    const url = editId ? `/api/admin/subscription-plans/${editId}` : "/api/admin/subscription-plans";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { toast.success(editId ? "تم التحديث" : "تمت الإضافة"); setShowForm(false); reload(); }
    else toast.error("فشل الحفظ");
  };

  const deactivate = async (id: string) => {
    const res = await fetch(`/api/admin/subscription-plans/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("تم إيقاف الخطة"); reload(); }
  };

  return (
    <div>
      <button onClick={openAdd} className="w-full mb-3 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> إضافة خطة</button>
      <div className="space-y-2.5">
        {plans.map((p) => (
          <motion.div key={p.id} layout className="legal-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold truncate">{p.name}</p>
                  {p.isActive ? <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">نشطة</span> : <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">متوقفة</span>}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px]">
                  <span className="font-extrabold text-primary number-magnify">{formatIQD(p.price)}</span>
                  <span className="text-muted-foreground">/ {p.durationDays} يوم</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                {p.isActive && <button onClick={() => deactivate(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Ban className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && setShowForm(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between">
                <h3 className="font-bold">{editId ? "تعديل خطة" : "خطة جديدة"}</h3>
                <button onClick={() => !saving && setShowForm(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-3">
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الاسم *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" dir="rtl" /></label>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الوصف</span><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-input resize-none" dir="rtl" /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block"><span className="text-xs text-muted-foreground mb-1 block">السعر (د.ع)</span><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="form-input" dir="ltr" /></label>
                  <label className="block"><span className="text-xs text-muted-foreground mb-1 block">المدة (أيام)</span><input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} className="form-input" dir="ltr" /></label>
                </div>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">المميزات (مفصولة بفواصل)</span><textarea rows={3} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="form-input resize-none" dir="rtl" placeholder="قضايا غير محدودة, موكلين غير محدودين..." /></label>
                <label className="flex items-center gap-2 text-sm py-1"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-[hsl(158_84%_30%)]" /> خطة نشطة</label>
              </div>
              <div className="sticky bottom-0 p-4 border-t bg-card/95 backdrop-blur flex gap-2">
                <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm">إلغاء</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-70"><Check className="w-4 h-4" /> {saving ? "..." : "حفظ"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
