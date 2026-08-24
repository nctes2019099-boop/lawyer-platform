"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  Briefcase, Search, Plus, Clock, Gavel, CheckCircle2, XCircle,
  PauseCircle, Download, X, Building2, Timer,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getRelativeTime } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  "قيد النظر": { label: "قيد النظر", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/30", icon: Clock },
  "جاري التنفيذ": { label: "جاري التنفيذ", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30", icon: Timer },
  مقبولة: { label: "مقبولة", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/30", icon: CheckCircle2 },
  معلقة: { label: "معلقة", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-950/30", icon: PauseCircle },
  مكتملة: { label: "مكتملة", color: "text-green-600", bg: "bg-green-100 dark:bg-green-950/30", icon: CheckCircle2 },
  مؤجلة: { label: "مؤجلة", color: "text-primary", bg: "bg-primary/10", icon: PauseCircle },
  مرفوضة: { label: "مرفوضة", color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-950/30", icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string; bar: string; pulse: boolean }> = {
  عادية: { label: "عادية", color: "bg-gray-400", bar: "bg-gray-400", pulse: false },
  مهمة: { label: "مهمة", color: "bg-blue-500", bar: "bg-blue-500", pulse: false },
  عاجلة: { label: "عاجلة", color: "bg-amber-500", bar: "bg-amber-500", pulse: true },
  حرجة: { label: "حرجة", color: "bg-rose-500", bar: "bg-rose-500", pulse: true },
};

const tabs = ["الكل", "قيد النظر", "جاري التنفيذ", "مكتملة", "مؤجلة", "مرفوضة"];
const caseTypes = ["مدني", "جنائي", "تجاري", "أحوال شخصية", "إداري", "عمل", "عقاري", "مرور"];
const priorities = ["عادية", "مهمة", "عاجلة", "حرجة"];
const statuses = ["قيد النظر", "جاري التنفيذ", "مكتملة", "مؤجلة", "مرفوضة", "مقبولة", "معلقة"];

const emptyForm = { caseNumber: "", title: "", description: "", type: "مدني", status: "قيد النظر", priority: "عادية", court: "", judge: "", clientId: "" };

export function CasesScreen() {
  const { navigate, dialogOpen, setDialogOpen } = useAppStore();
  const [cases, setCases] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const load = () =>
    fetch("/api/cases").then((r) => r.json()).then((d) => { setCases(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));

  useEffect(() => { load(); }, []);
  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then((d) => setClients(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (dialogOpen === "add") { setShowAdd(true); setDialogOpen(null); setForm({ ...emptyForm }); }
  }, [dialogOpen, setDialogOpen]);

  const stats = useMemo(() => {
    const total = cases.length;
    const active = cases.filter((c) => c.status === "قيد النظر" || c.status === "جاري التنفيذ").length;
    const now = new Date();
    const completedThisMonth = cases.filter((c) => c.status === "مكتملة" && c.updatedAt && new Date(c.updatedAt).getMonth() === now.getMonth()).length;
    return { total, active, completedThisMonth };
  }, [cases]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cases.filter((c) => {
      const matchTab = activeTab === "الكل" || c.status === activeTab;
      const matchSearch = !q || (c.title || "").toLowerCase().includes(q) || (c.caseNumber || "").includes(q);
      return matchTab && matchSearch;
    });
  }, [cases, search, activeTab]);

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("عنوان القضية مطلوب");
    if (!form.caseNumber.trim()) return toast.error("رقم القضية مطلوب");
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (!payload.clientId) delete payload.clientId;
      const res = await fetch("/api/cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast.success("تمت إضافة القضية");
      setShowAdd(false); setForm({ ...emptyForm }); await load();
    } catch { toast.error("تعذّر حفظ القضية"); } finally { setSaving(false); }
  };

  const exportCsv = () => { window.open("/api/export?type=cases", "_blank"); toast.success("يتم تنزيل ملف CSV"); };

  const nextSession = (sessions: any[]) => {
    if (!sessions?.length) return null;
    const now = new Date();
    const upcoming = sessions.filter((s) => new Date(s.date) >= now).sort((a, b) => +new Date(a.date) - +new Date(b.date));
    return upcoming[0] || null;
  };

  const containerV = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const itemV = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 24 } } };

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold">القضايا</h2>
            <p className="text-[11px] text-muted-foreground">إدارة ومتابعة القضايا</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={exportCsv} className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center" title="تصدير CSV"><Download className="w-4 h-4" /></button>
          <button onClick={() => { setShowAdd(true); setForm({ ...emptyForm }); }} className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/30"><Plus className="w-5 h-5 text-white" /></button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث برقم أو عنوان القضية..." className="form-input pr-10" dir="rtl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <MiniStat value={stats.total} label="الكل" color="text-foreground" />
        <MiniStat value={stats.active} label="نشطة" color="text-emerald-600" />
        <MiniStat value={stats.completedThisMonth} label="مكتملة الشهر" color="text-primary" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-4">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${activeTab === tab ? "brand-emerald text-white shadow" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
            {tab}
          </button>
        ))}
      </div>

      <motion.div variants={containerV} initial="hidden" animate="show" className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-secondary/50 animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">لا توجد قضايا</p>
          </div>
        ) : (
          filtered.map((c) => {
            const st = statusConfig[c.status] || statusConfig["قيد النظر"];
            const pr = priorityConfig[c.priority] || priorityConfig["عادية"];
            const StatusIcon = st.icon;
            const session = nextSession(c.sessions);
            return (
              <motion.button
                key={c.id} variants={itemV} layout onClick={() => navigate("case-details", { caseId: c.id })}
                className="relative w-full text-right legal-card rounded-2xl p-4 hover-legal overflow-hidden"
              >
                <span className={`absolute right-0 top-3 bottom-3 w-[3px] rounded-l-full ${pr.bar}`} />
                {pr.pulse && <span className={`absolute right-[5px] top-3 w-2 h-2 rounded-full ${pr.color} animate-ping`} />}
                <div className="pr-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground">#{c.caseNumber}</span>
                        <span className="text-[10px] text-muted-foreground/60">•</span>
                        <span className="text-[10px] text-muted-foreground">{c.type}</span>
                      </div>
                      <p className="text-sm font-bold mt-0.5 truncate">{c.title}</p>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md ${st.bg} ${st.color} text-[10px] font-semibold`}>
                      <StatusIcon className="w-3 h-3" /> {st.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[10px] text-muted-foreground">
                    {c.court && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {c.court}</span>}
                    {c.client?.name && <span className="flex items-center gap-1"><Gavel className="w-3 h-3" /> {c.client.name}</span>}
                    {session ? (
                      <span className="flex items-center gap-1 text-primary font-semibold"><CalendarIcon className="w-3 h-3" /> {getRelativeTime(session.date)}</span>
                    ) : (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {pr.label}</span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </motion.div>

      {/* Add dialog */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && setShowAdd(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between">
                <h3 className="font-bold">قضية جديدة</h3>
                <button onClick={() => !saving && setShowAdd(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-3">
                <Field label="رقم القضية *"><input value={form.caseNumber} onChange={(e) => setForm({ ...form, caseNumber: e.target.value })} className="form-input" placeholder="2026/123" dir="ltr" /></Field>
                <Field label="عنوان القضية *"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="form-input" dir="rtl" /></Field>
                <Field label="الموكل"><select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="form-input" dir="rtl"><option value="">— بدون —</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="النوع"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="form-input" dir="rtl">{caseTypes.map((t) => <option key={t}>{t}</option>)}</select></Field>
                  <Field label="الأولوية"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="form-input" dir="rtl">{priorities.map((t) => <option key={t}>{t}</option>)}</select></Field>
                  <Field label="الحالة"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-input" dir="rtl">{statuses.map((t) => <option key={t}>{t}</option>)}</select></Field>
                  <Field label="المحكمة"><input value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} className="form-input" dir="rtl" /></Field>
                </div>
                <Field label="القاضي"><input value={form.judge} onChange={(e) => setForm({ ...form, judge: e.target.value })} className="form-input" dir="rtl" /></Field>
                <Field label="الوصف"><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-input resize-none" dir="rtl" /></Field>
              </div>
              <div className="sticky bottom-0 bg-card/95 backdrop-blur p-4 border-t flex gap-2">
                <button onClick={() => setShowAdd(false)} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm font-medium">إلغاء</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold disabled:opacity-70">{saving ? "جارٍ الحفظ..." : "حفظ القضية"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="legal-card rounded-xl p-3 text-center">
      <p className={`text-2xl font-extrabold number-magnify ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>{children}</label>;
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
