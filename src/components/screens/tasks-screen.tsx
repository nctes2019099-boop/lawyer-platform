"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Plus, X, Flag, Briefcase, CalendarClock,
  Trash2, Clock, CheckCheck,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getRelativeTime } from "@/lib/utils";
import { toast } from "react-hot-toast";

const statuses = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "قيد الانتظار" },
  { key: "in_progress", label: "جاري" },
  { key: "completed", label: "مكتملة" },
] as const;

const priorities = ["عادية", "مهمة", "عاجلة", "حرجة"] as const;
const priConfig: Record<string, { color: string; bar: string; dot: string }> = {
  "عادية": { color: "text-slate-600", bar: "border-slate-400", dot: "bg-slate-400" },
  "مهمة": { color: "text-sky-600", bar: "border-sky-500", dot: "bg-sky-500" },
  "عاجلة": { color: "text-amber-600", bar: "border-amber-500", dot: "bg-amber-500" },
  "حرجة": { color: "text-rose-600", bar: "border-rose-500", dot: "bg-rose-500" },
};

const statusLabel: Record<string, string> = { pending: "قيد الانتظار", in_progress: "جاري التنفيذ", completed: "مكتملة" };

const emptyForm = { title: "", priority: "عادية" as (typeof priorities)[number], dueDate: "", caseId: "" };

export function TasksScreen() {
  const { navigate, dialogOpen, setDialogOpen } = useAppStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/tasks").then((r) => r.json()).then((d) => { setTasks(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => {
    load();
    fetch("/api/cases").then((r) => r.json()).then((d) => setCases(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  useEffect(() => { if (dialogOpen === "add") { setDialogOpen(null); setShowForm(true); } }, [dialogOpen, setDialogOpen]);

  const filtered = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }), [tasks]);

  const toggle = async (task: any) => {
    const next = task.status === "completed" ? "pending" : "completed";
    const prev = tasks;
    setTasks((p) => p.map((x) => x.id === task.id ? { ...x, status: next, completedAt: next === "completed" ? new Date().toISOString() : null } : x));
    const res = await fetch(`/api/tasks/${task.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    if (!res.ok) { setTasks(prev); toast.error("فشل التحديث"); }
  };

  const setProgress = async (id: string, status: string) => {
    const prev = tasks;
    setTasks((p) => p.map((x) => x.id === id ? { ...x, status } : x));
    const res = await fetch(`/api/tasks/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!res.ok) { setTasks(prev); toast.error("فشل التحديث"); }
  };

  const remove = async (id: string) => {
    const prev = tasks; setTasks((p) => p.filter((x) => x.id !== id));
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) { setTasks(prev); toast.error("فشل الحذف"); }
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    setSaving(true);
    const payload: any = { title: form.title, priority: form.priority };
    if (form.dueDate) payload.dueDate = new Date(`${form.dueDate}T09:00:00`).toISOString();
    if (form.caseId) payload.caseId = form.caseId;
    const res = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { toast.success("تمت الإضافة"); setShowForm(false); setForm({ ...emptyForm }); load(); }
    else toast.error("فشل الحفظ");
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20"><CheckCheck className="w-5 h-5 text-white" /></div>
          <div><h2 className="text-lg font-extrabold">المهام</h2><p className="text-[11px] text-muted-foreground">{counts.pending + counts.in_progress} مهمة نشطة</p></div>
        </div>
        <button onClick={() => setShowForm(true)} className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/30"><Plus className="w-5 h-5 text-white" /></button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-3">
        {statuses.map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)} className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${filter === s.key ? "brand-emerald text-white shadow" : "bg-secondary text-muted-foreground"}`}>
            {s.label} <span className="opacity-70">({counts[s.key as keyof typeof counts]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2.5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-secondary/50 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">لا توجد مهام</p></div>
      ) : (
        <motion.div className="space-y-2.5" layout>
          <AnimatePresence>
            {filtered.map((t) => {
              const pc = priConfig[t.priority] || priConfig["عادية"];
              const done = t.status === "completed";
              const overdue = !done && t.dueDate && new Date(t.dueDate) < new Date();
              return (
                <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 60 }} className={`legal-card rounded-2xl p-3.5 flex items-start gap-3 border-r-[3px] ${pc.bar} ${done ? "opacity-60" : ""}`}>
                  <button onClick={() => toggle(t)} className="mt-0.5 shrink-0">
                    {done ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5 text-muted-foreground/50" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${done ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-1 text-[10px] text-muted-foreground">
                      <span className={`flex items-center gap-0.5 font-semibold ${pc.color}`}><Flag className="w-3 h-3" />{t.priority}</span>
                      {t.dueDate && (
                        <span className={`flex items-center gap-0.5 ${overdue ? "text-rose-600 font-bold" : ""}`}>
                          <CalendarClock className="w-3 h-3" /> {new Date(t.dueDate).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                          {overdue && " • متأخرة"}
                        </span>
                      )}
                      {t.case && (
                        <button onClick={() => navigate("case-details", { caseId: t.caseId })} className="flex items-center gap-0.5 text-primary hover:underline">
                          <Briefcase className="w-3 h-3" />{t.case.caseNumber}
                        </button>
                      )}
                      {done && t.completedAt && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{getRelativeTime(t.completedAt)}</span>}
                    </div>
                    {!done && (
                      <div className="flex gap-1 mt-2">
                        {(["pending", "in_progress", "completed"] as const).map((st) => (
                          <button key={st} onClick={() => setProgress(t.id, st)} className={`px-2 py-0.5 rounded-md text-[9px] font-semibold ${t.status === st ? "brand-emerald text-white" : "bg-secondary text-muted-foreground"}`}>{statusLabel[st]}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => remove(t.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && setShowForm(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between">
                <h3 className="font-bold">مهمة جديدة</h3>
                <button onClick={() => !saving && setShowForm(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-3">
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">عنوان المهمة *</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="form-input" dir="rtl" /></label>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الأولوية</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {priorities.map((p) => (
                      <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })} className={`py-2 rounded-lg text-[11px] font-semibold border ${form.priority === p ? "brand-emerald text-white border-transparent" : "border-border text-muted-foreground"}`}>{p}</button>
                    ))}
                  </div>
                </label>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">تاريخ الاستحقاق</span><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="form-input" dir="ltr" /></label>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">ربط بقضية</span>
                  <select value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })} className="form-input" dir="rtl"><option value="">—</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>)}</select>
                </label>
              </div>
              <div className="sticky bottom-0 p-4 border-t bg-card/95 backdrop-blur flex gap-2">
                <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm">إلغاء</button>
                <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold disabled:opacity-70">{saving ? "جارٍ..." : "حفظ"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
