"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  Briefcase, Search, Plus, Clock,
  Gavel, CheckCircle2, XCircle, PauseCircle, X,
} from "lucide-react";
import { toast } from "react-hot-toast";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  "قيد النظر": { label: "قيد النظر", color: "text-amber-600", icon: Clock },
  "جاري التنفيذ": { label: "جاري التنفيذ", color: "text-emerald-600", icon: Gavel },
  مكتملة: { label: "مكتملة", color: "text-emerald-700", icon: CheckCircle2 },
  مؤجلة: { label: "مؤجلة", color: "text-primary", icon: PauseCircle },
  مرفوضة: { label: "مرفوضة", color: "text-destructive", icon: XCircle },
};

const priorityConfig: Record<string, { color: string; barColor: string; label: string }> = {
  عادية: { color: "bg-emerald-500", barColor: "bg-emerald-500", label: "عادية" },
  مهمة: { color: "bg-amber-500", barColor: "bg-amber-500", label: "مهمة" },
  عاجلة: { color: "bg-rose-500", barColor: "bg-rose-500", label: "عاجلة" },
  حرجة: { color: "bg-destructive", barColor: "bg-destructive", label: "حرجة" },
};

const tabs = ["الكل", "قيد النظر", "جاري التنفيذ", "مكتملة", "مؤجلة", "مرفوضة"];
const caseTypes = ["مدني", "جنائي", "تجاري", "أحوال شخصية", "إداري", "عمل", "عقاري", "مرور"];
const priorities = ["عادية", "مهمة", "عاجلة", "حرجة"];
const statuses = ["قيد النظر", "جاري التنفيذ", "مكتملة", "مؤجلة", "مرفوضة"];

const emptyForm = {
  caseNumber: "", title: "", description: "", type: "مدني",
  status: "قيد النظر", priority: "عادية", court: "", judge: "",
};

export function CasesScreen() {
  const { navigate, dialogOpen, setDialogOpen } = useAppStore();
  const [cases, setCases] = useState<Record<string, unknown>[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, clientId: "" });

  const load = () =>
    fetch("/api/cases")
      .then((r) => r.json())
      .then((data) => { setCases(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);
  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then((d) => setClients(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (dialogOpen === "add") { setShowAdd(true); setDialogOpen(null); setForm({ ...emptyForm, clientId: "" }); }
  }, [dialogOpen, setDialogOpen]);

  const filtered = useMemo(() => cases.filter((c: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (c.title || "").toLowerCase().includes(q) || (c.caseNumber || "").includes(q);
    const matchesTab = activeTab === "الكل" || c.status === activeTab;
    return matchesSearch && matchesTab;
  }), [cases, search, activeTab]);

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("عنوان القضية مطلوب");
    if (!form.caseNumber.trim()) return toast.error("رقم القضية مطلوب");
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (!payload.clientId) delete payload.clientId;
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success("تمت إضافة القضية");
      setShowAdd(false);
      setForm({ ...emptyForm, clientId: "" });
      await load();
    } catch {
      toast.error("تعذّر حفظ القضية");
    } finally {
      setSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen p-4 pb-24 fingerprint-bg">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-lg mx-auto space-y-4">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">إدارة القضايا</p>
            <h2 className="text-lg font-bold text-foreground">القضايا</h2>
          </div>
          <motion.button
            onClick={() => { setShowAdd(true); setForm({ ...emptyForm, clientId: "" }); }}
            className="w-10 h-10 rounded-xl seal-gold flex items-center justify-center shadow-md"
            whileTap={{ scale: 0.9 }}
          >
            <Plus className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>

        <motion.div variants={itemVariants} className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث في القضايا..."
            className="w-full h-11 pr-10 pl-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none"
            dir="rtl"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                activeTab === tab ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}>
              {tab}
            </button>
          ))}
        </motion.div>

        <motion.div variants={containerVariants} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <motion.div key={i} variants={itemVariants} className="legal-card rounded-2xl p-4 h-24 animate-pulse" />)
            ) : filtered.length === 0 ? (
              <motion.div variants={itemVariants} className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">لا توجد قضايا</p>
              </motion.div>
            ) : (
              filtered.map((c: any) => {
                const status = statusConfig[c.status] || statusConfig["قيد النظر"];
                const priority = priorityConfig[c.priority] || priorityConfig["عادية"];
                const StatusIcon = status.icon;
                return (
                  <motion.div key={c.id} variants={itemVariants} layout
                    className="legal-card rounded-2xl p-4 hover-legal cursor-pointer relative"
                    onClick={() => navigate("case-details", { caseId: c.id })}>
                    <div className={`absolute right-0 top-4 bottom-4 w-[3px] rounded-full ${priority.barColor}`} />
                    <div className="pr-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{c.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">#{c.caseNumber}</p>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/50 ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="text-[10px] font-medium">{status.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${priority.color}`} />
                        <span className="text-[10px] text-muted-foreground">{priority.label}</span>
                        <span className="text-[10px] text-muted-foreground/50">•</span>
                        <span className="text-[10px] text-muted-foreground">{c.type || "غير محدد"}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Add Case Dialog */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => !saving && setShowAdd(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold">قضية جديدة</h3>
                <button onClick={() => !saving && setShowAdd(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <Field label="رقم القضية *">
                  <input value={form.caseNumber} onChange={(e) => setForm({ ...form, caseNumber: e.target.value })}
                    className="form-input" placeholder="مثال: 2026/123" dir="ltr" />
                </Field>
                <Field label="عنوان القضية *">
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="form-input" placeholder="مثال: دعوى تعويض ضد..." dir="rtl" />
                </Field>
                <Field label="الموكل">
                  <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    className="form-input" dir="rtl">
                    <option value="">— بدون موكل —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="النوع">
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="form-input" dir="rtl">
                      {caseTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="الأولوية">
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="form-input" dir="rtl">
                      {priorities.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="الحالة">
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-input" dir="rtl">
                      {statuses.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="المحكمة">
                    <input value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} className="form-input" dir="rtl" />
                  </Field>
                </div>
                <Field label="القاضي">
                  <input value={form.judge} onChange={(e) => setForm({ ...form, judge: e.target.value })} className="form-input" dir="rtl" />
                </Field>
                <Field label="الوصف">
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3} className="form-input resize-none" dir="rtl" />
                </Field>
              </div>
              <div className="sticky bottom-0 bg-card/95 backdrop-blur p-4 border-t border-border flex gap-2">
                <button onClick={() => setShowAdd(false)} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-all text-sm font-medium">إلغاء</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl seal-gold text-white hover:opacity-90 transition-all text-sm font-medium disabled:opacity-70">
                  {saving ? "جارٍ الحفظ..." : "حفظ القضية"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}
