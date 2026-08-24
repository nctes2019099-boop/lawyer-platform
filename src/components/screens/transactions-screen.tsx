"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Plus, TrendingUp, TrendingDown, Pencil, Trash2, X, Briefcase, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatIQD, getRelativeTime } from "@/lib/utils";
import { toast } from "react-hot-toast";

const categories = ["أتعاب محاماة", "مصاريف محكمة", "سفر ومواصلات", "رسوم حكومية", "استشارات", "مستندات", "أخرى"];
const types = ["income", "expense"] as const;

const emptyForm = { title: "", amount: "", type: "income" as "income" | "expense", category: "أتعاب محاماة", date: new Date().toISOString().slice(0, 10), caseId: "", clientId: "", description: "" };

export function TransactionsScreen() {
  const { navigate, dialogOpen, setDialogOpen } = useAppStore();
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<{ months: { month: string; income: number; expenses: number }[] }>({ months: [] });
  const [cases, setCases] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [catFilter, setCatFilter] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/transactions").then((r) => r.json()).then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/transactions/stats").then((r) => r.json()).then(setStats).catch(() => {});
  };
  useEffect(() => { load(); fetch("/api/cases").then((r) => r.json()).then((d) => setCases(Array.isArray(d) ? d : [])).catch(() => {}); fetch("/api/clients").then((r) => r.json()).then((d) => setClients(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  useEffect(() => { if (dialogOpen === "add") { setDialogOpen(null); openAdd(); } }, [dialogOpen, setDialogOpen]);

  const totals = useMemo(() => {
    const income = items.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = items.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    return { income, expense, net: income - expense };
  }, [items]);

  const filtered = useMemo(() => items.filter((t) => {
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const matchCat = catFilter === "الكل" || t.category === catFilter;
    return matchType && matchCat;
  }).sort((a, b) => +new Date(b.date) - +new Date(a.date)), [items, typeFilter, catFilter]);

  const openAdd = () => { setEditId(null); setForm({ ...emptyForm }); setShowForm(true); };
  const openEdit = (t: any) => { setEditId(t.id); setForm({ title: t.title, amount: String(Math.abs(t.amount)), type: t.type, category: t.category, date: new Date(t.date).toISOString().slice(0, 10), caseId: t.caseId || "", clientId: t.clientId || "", description: t.description || "" }); setShowForm(true); };

  const save = async () => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return toast.error("أدخل مبلغاً صحيحاً");
    setSaving(true);
    const payload: any = { title: form.title, amount, type: form.type, category: form.category, date: new Date(`${form.date}T09:00:00`).toISOString(), description: form.description };
    if (form.caseId) payload.caseId = form.caseId;
    if (form.clientId) payload.clientId = form.clientId;
    const url = editId ? `/api/transactions/${editId}` : "/api/transactions";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { toast.success(editId ? "تم التحديث" : "تمت الإضافة"); setShowForm(false); load(); }
    else toast.error("فشل الحفظ");
  };

  const remove = async (id: string) => {
    const prev = items; setItems((p) => p.filter((x) => x.id !== id));
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) { setItems(prev); toast.error("فشل الحذف"); }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20"><Wallet className="w-5 h-5 text-white" /></div>
          <div><h2 className="text-lg font-extrabold">المعاملات المالية</h2><p className="text-[11px] text-muted-foreground">الإيرادات والمصروفات</p></div>
        </div>
        <button onClick={openAdd} className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/30"><Plus className="w-5 h-5 text-white" /></button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <SumCard icon={<TrendingUp className="w-4 h-4" />} value={totals.income} label="إيرادات" color="text-emerald-600" bg="bg-emerald-500" />
        <SumCard icon={<TrendingDown className="w-4 h-4" />} value={totals.expense} label="مصروفات" color="text-rose-600" bg="bg-rose-500" />
        <SumCard value={totals.net} label="الصافي" color={totals.net >= 0 ? "text-primary" : "text-rose-600"} bg="bg-primary" />
      </div>

      {/* Chart */}
      {stats.months.length > 0 && <MonthlyChart data={stats.months} />}

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-2">
        {(["all", "income", "expense"] as const).map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${typeFilter === t ? "brand-emerald text-white shadow" : "bg-secondary text-muted-foreground"}`}>
            {t === "all" ? "الكل" : t === "income" ? "إيرادات" : "مصروفات"}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-3">
        {["الكل", ...categories].map((c) => (
          <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap ${catFilter === c ? "bg-secondary-foreground text-background" : "bg-secondary text-muted-foreground"}`}>{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-secondary/50 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">لا توجد معاملات</p></div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`legal-card rounded-2xl p-3.5 flex items-center gap-3 border-r-[3px] ${t.type === "income" ? "border-emerald-500" : "border-rose-500"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                {t.type === "income" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{t.title}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                  <span>{t.category}</span>
                  {t.case && <button onClick={() => navigate("case-details", { caseId: t.caseId })} className="flex items-center gap-0.5 text-primary hover:underline"><Briefcase className="w-3 h-3" />{t.case.caseNumber}</button>}
                  {t.client && <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{t.client.name}</span>}
                  <span>• {getRelativeTime(t.date)}</span>
                </p>
              </div>
              <div className="text-left shrink-0">
                <p className={`text-sm font-extrabold number-magnify ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "income" ? "+" : "−"}{formatIQD(t.amount)}</p>
                <div className="flex items-center gap-0.5 justify-end mt-1">
                  <button onClick={() => openEdit(t)} className="p-1 rounded hover:bg-secondary"><Pencil className="w-3 h-3 text-muted-foreground" /></button>
                  <button onClick={() => remove(t.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3 h-3 text-destructive" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && setShowForm(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between">
                <h3 className="font-bold">{editId ? "تعديل معاملة" : "معاملة جديدة"}</h3>
                <button onClick={() => !saving && setShowForm(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-3">
                {/* Type toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/60 rounded-xl">
                  <button type="button" onClick={() => setForm({ ...form, type: "income" })} className={`py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${form.type === "income" ? "bg-emerald-500 text-white shadow" : "text-muted-foreground"}`}><TrendingUp className="w-4 h-4" /> إيراد</button>
                  <button type="button" onClick={() => setForm({ ...form, type: "expense" })} className={`py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${form.type === "expense" ? "bg-rose-500 text-white shadow" : "text-muted-foreground"}`}><TrendingDown className="w-4 h-4" /> مصروف</button>
                </div>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">العنوان *</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="form-input" dir="rtl" /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block"><span className="text-xs text-muted-foreground mb-1 block">المبلغ (د.ع) *</span><input type="number" inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="form-input" dir="ltr" /></label>
                  <label className="block"><span className="text-xs text-muted-foreground mb-1 block">التاريخ</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="form-input" dir="ltr" /></label>
                </div>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">التصنيف</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="form-input" dir="rtl">{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block"><span className="text-xs text-muted-foreground mb-1 block">القضية</span><select value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })} className="form-input" dir="rtl"><option value="">—</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.caseNumber}</option>)}</select></label>
                  <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الموكل</span><select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="form-input" dir="rtl"><option value="">—</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                </div>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">ملاحظات</span><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-input resize-none" dir="rtl" /></label>
              </div>
              <div className="sticky bottom-0 p-4 border-t bg-card/95 backdrop-blur flex gap-2">
                <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm font-medium">إلغاء</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold disabled:opacity-70">{saving ? "جارٍ..." : "حفظ"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SumCard({ icon, value, label, color, bg }: { icon?: React.ReactNode; value: number; label: string; color: string; bg: string }) {
  return (
    <div className="legal-card rounded-xl p-3 relative overflow-hidden">
      <span className={`absolute top-0 right-0 w-1 h-full ${bg}`} />
      <div className="pr-1.5">
        {icon && <div className={`mb-1 ${color}`}>{icon}</div>}
        <p className={`text-base font-extrabold number-magnify ${color}`}>{formatIQD(value)}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function MonthlyChart({ data }: { data: { month: string; income: number; expenses: number }[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expenses]));
  const W = 320, H = 130, pad = 16, bw = 14, gap = 10;
  const groupW = (W - pad * 2) / data.length;
  return (
    <div className="legal-card rounded-2xl p-4 mb-4">
      <p className="text-xs font-bold mb-3 flex items-center gap-1.5"><Wallet className="w-4 h-4 text-primary" /> الرسم الشهري (آخر 6 أشهر)</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={pad} x2={W - pad} y1={H - pad - g * (H - pad * 2)} y2={H - pad - g * (H - pad * 2)} stroke="hsl(var(--border))" strokeDasharray="3 3" strokeWidth="0.5" />
        ))}
        {data.map((d, i) => {
          const x = pad + i * groupW + (groupW - bw * 2 - gap) / 2;
          const ih = (d.income / max) * (H - pad * 2);
          const eh = (d.expenses / max) * (H - pad * 2);
          return (
            <g key={i}>
              <rect x={x} y={H - pad - ih} width={bw} height={ih} rx="3" fill="#10b981" />
              <rect x={x + bw + gap} y={H - pad - eh} width={bw} height={eh} rx="3" fill="#f43f5e" />
              <text x={x + bw + gap / 2} y={H - 2} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 8 }}>{d.month}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> إيرادات</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> مصروفات</span>
      </div>
    </div>
  );
}
