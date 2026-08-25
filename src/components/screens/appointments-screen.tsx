"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  CalendarDays, Plus, Check, Trash2, Pencil, X, Gavel, MessageSquare,
  Users, BookOpen, MapPin, Clock as ClockIcon, Calendar,
} from "lucide-react";
import { toast } from "react-hot-toast";

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  جلسة: { label: "جلسة", icon: Gavel, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/30", border: "border-emerald-400" },
  استشارة: { label: "استشارة", icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/30", border: "border-blue-400" },
  اجتماع: { label: "اجتماع", icon: Users, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30", border: "border-amber-400" },
  مذاكرة: { label: "مذاكرة", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-950/30", border: "border-purple-400" },
};
const types = Object.keys(typeConfig);

const emptyForm = { title: "", date: "", time: "09:00", location: "", type: "جلسة", notes: "", caseId: "", clientId: "" };

function toLocalInput(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toISOString().slice(0, 10);
}

export function AppointmentsScreen() {
  const { dialogOpen, setDialogOpen, navigate } = useAppStore();
  const [items, setItems] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const load = () => fetch("/api/appointments").then((r) => r.json()).then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); fetch("/api/cases").then((r) => r.json()).then((d) => setCases(Array.isArray(d) ? d : [])).catch(() => {}); fetch("/api/clients").then((r) => r.json()).then((d) => setClients(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  useEffect(() => {
    if (dialogOpen === "add") { setDialogOpen(null); openAdd(); }
  }, [dialogOpen, setDialogOpen]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const upcoming = items.filter((a) => new Date(a.date) >= now && a.status !== "مكتملة").length;
    const todays = items.filter((a) => { const d = new Date(a.date); return d >= today && d < new Date(today.getTime() + 86400000); }).length;
    const completedMonth = items.filter((a) => a.status === "مكتملة" && new Date(a.date) >= monthStart).length;
    return { upcoming, todays, completedMonth };
  }, [items]);

  const openAdd = () => { setEditId(null); setForm({ ...emptyForm, date: toLocalInput() }); setShowForm(true); };
  const openEdit = (a: any) => {
    setEditId(a.id);
    const d = new Date(a.date);
    setForm({
      title: a.title, date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5),
      location: a.location || "", type: a.type || "جلسة", notes: a.notes || "",
      caseId: a.caseId || "", clientId: a.clientId || "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    if (!form.date) return toast.error("التاريخ مطلوب");
    setSaving(true);
    const iso = new Date(`${form.date}T${form.time}:00`).toISOString();
    const payload: any = { title: form.title, date: iso, location: form.location, type: form.type, notes: form.notes };
    if (form.caseId) payload.caseId = form.caseId;
    if (form.clientId) payload.clientId = form.clientId;
    const ok = async () => {
      if (editId) {
        const res = await fetch(`/api/appointments/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        return res.ok;
      }
      const res = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      return res.ok;
    };
    if (await ok()) { toast.success(editId ? "تم التحديث" : "تمت الإضافة"); setShowForm(false); await load(); }
    else toast.error("فشل الحفظ");
    setSaving(false);
  };

  const toggleComplete = async (a: any) => {
    const newStatus = a.status === "مكتملة" ? "قادمة" : "مكتملة";
    setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: newStatus } : x)));
    const res = await fetch(`/api/appointments/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    if (!res.ok) { setItems((prev) => prev.map((x) => (x.id === a.id ? a : x))); toast.error("فشل التحديث"); }
  };

  const remove = async (id: string) => {
    const prev = items; setItems((p) => p.filter((x) => x.id !== id));
    const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    if (!res.ok) { setItems(prev); toast.error("فشل الحذف"); }
    else toast.success("تم الحذف");
  };

  // Grouping by date
  const groups = useMemo(() => {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    const weekEnd = new Date(today.getTime() + 7 * 86400000);
    const buckets: { key: string; label: string; items: any[] }[] = [
      { key: "today", label: "اليوم", items: [] }, { key: "tomorrow", label: "غداً", items: [] },
      { key: "week", label: "هذا الأسبوع", items: [] }, { key: "later", label: "لاحقاً", items: [] },
    ];
    const sorted = [...items].sort((a, b) => +new Date(a.date) - +new Date(b.date));
    for (const a of sorted) {
      const d = new Date(a.date); d.setHours(0, 0, 0, 0);
      if (d.getTime() === today.getTime()) buckets[0].items.push(a);
      else if (d.getTime() === tomorrow.getTime()) buckets[1].items.push(a);
      else if (d < weekEnd) buckets[2].items.push(a);
      else buckets[3].items.push(a);
    }
    return buckets.filter((b) => b.items.length > 0);
  }, [items]);

  const calDays = useMemo(() => buildCalendar(calMonth.y, calMonth.m, items), [calMonth, items]);
  const monthLabel = new Date(calMonth.y, calMonth.m).toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
  const dayItems = useMemo(() => selectedDate ? items.filter((a) => new Date(a.date).toDateString() === new Date(selectedDate).toDateString()).sort((a, b) => +new Date(a.date) - +new Date(b.date)) : [], [selectedDate, items]);

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20"><CalendarDays className="w-5 h-5 text-white" /></div>
          <div><h2 className="text-lg font-extrabold">المواعيد</h2><p className="text-[11px] text-muted-foreground">جدول الجلسات والاستشارات</p></div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex bg-secondary/60 rounded-xl p-0.5">
            <button onClick={() => setViewMode("list")} className={`px-3 h-9 rounded-lg text-xs font-semibold flex items-center gap-1 ${viewMode === "list" ? "bg-card shadow text-primary" : "text-muted-foreground"}`}><CalendarDays className="w-3.5 h-3.5" /> قائمة</button>
            <button onClick={() => setViewMode("calendar")} className={`px-3 h-9 rounded-lg text-xs font-semibold flex items-center gap-1 ${viewMode === "calendar" ? "bg-card shadow text-primary" : "text-muted-foreground"}`}><Calendar className="w-3.5 h-3.5" /> تقويم</button>
          </div>
          <button onClick={openAdd} className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/30"><Plus className="w-5 h-5 text-white" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <MiniStat value={stats.upcoming} label="قادمة" color="text-emerald-600" />
        <MiniStat value={stats.todays} label="اليوم" color="text-amber-600" />
        <MiniStat value={stats.completedMonth} label="مكتملة الشهر" color="text-primary" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-secondary/50 animate-pulse" />)}</div>
      ) : viewMode === "list" ? (
        <div className="space-y-5">
          {groups.length === 0 && <Empty />}
          {groups.map((g) => (
            <div key={g.key}>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> {g.label}</p>
              <div className="space-y-2.5">
                {g.items.map((a) => <AppointmentCard key={a.id} a={a} onToggle={() => toggleComplete(a)} onEdit={() => openEdit(a)} onDelete={() => remove(a.id)} onCase={() => a.caseId && navigate("case-details", { caseId: a.caseId })} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="legal-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setCalMonth(shift(calMonth, -1))} className="w-8 h-8 rounded-lg hover:bg-secondary">‹</button>
              <p className="text-sm font-bold">{monthLabel}</p>
              <button onClick={() => setCalMonth(shift(calMonth, 1))} className="w-8 h-8 rounded-lg hover:bg-secondary">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">{["ح", "ن", "ث", "ر", "خ", "ج", "س"].map((d, i) => <span key={i}>{d}</span>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {calDays.map((d, i) => {
                const today = isToday(d.date);
                const selected = selectedDate && new Date(selectedDate).toDateString() === d.date.toDateString();
                return (
                  <button key={i} onClick={() => d.hasEvents ? setSelectedDate(d.date.toISOString().slice(0, 10)) : setSelectedDate(null)}
                    className={`aspect-square rounded-lg text-[11px] relative flex flex-col items-center justify-center transition-colors ${selected ? "brand-emerald text-white font-bold" : today ? "ring-2 ring-primary text-primary font-bold" : d.currentMonth ? "hover:bg-secondary" : "text-muted-foreground/40"}`}>
                    {d.day}
                    {d.hasEvents && <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${selected ? "bg-white" : "bg-primary"}`} />}
                  </button>
                );
              })}
            </div>
          </div>
          {selectedDate && (
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground">مواعيد {new Date(selectedDate).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}</p>
              {dayItems.length ? dayItems.map((a) => <AppointmentCard key={a.id} a={a} onToggle={() => toggleComplete(a)} onEdit={() => openEdit(a)} onDelete={() => remove(a.id)} onCase={() => a.caseId && navigate("case-details", { caseId: a.caseId })} />) : <p className="text-sm text-muted-foreground text-center py-6">لا توجد مواعيد</p>}
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && setShowForm(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between">
                <h3 className="font-bold">{editId ? "تعديل الموعد" : "موعد جديد"}</h3>
                <button onClick={() => !saving && setShowForm(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-3">
                <Field label="العنوان *"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="form-input" dir="rtl" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="التاريخ *"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="form-input" dir="ltr" /></Field>
                  <Field label="الوقت"><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="form-input" dir="ltr" /></Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="النوع"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="form-input" dir="rtl">{types.map((t) => <option key={t}>{t}</option>)}</select></Field>
                  <Field label="الموقع"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="form-input" dir="rtl" /></Field>
                </div>
                <Field label="القضية المرتبطة"><select value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })} className="form-input" dir="rtl"><option value="">— بدون —</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></Field>
                <Field label="الموكل"><select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="form-input" dir="rtl"><option value="">— بدون —</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
                <Field label="ملاحظات"><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="form-input resize-none" dir="rtl" /></Field>
              </div>
              <div className="sticky bottom-0 bg-card/95 backdrop-blur p-4 border-t flex gap-2">
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

function AppointmentCard({ a, onToggle, onEdit, onDelete, onCase }: { a: any; onToggle: () => void; onEdit: () => void; onDelete: () => void; onCase: () => void }) {
  const cfg = typeConfig[a.type] || typeConfig["جلسة"];
  const Icon = cfg.icon;
  const done = a.status === "مكتملة";
  const d = new Date(a.date);
  return (
    <motion.div layout className={`legal-card rounded-2xl p-3.5 flex items-center gap-3 border-r-[3px] ${cfg.border} ${done ? "opacity-60" : ""}`}>
      <button onClick={onToggle} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${done ? "bg-primary border-primary text-white" : "border-border hover:border-primary"}`}>
        {done && <Check className="w-3.5 h-3.5" />}
      </button>
      <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}><Icon className={`w-4 h-4 ${cfg.color}`} /></div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${done ? "line-through" : ""}`}>{a.title}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><ClockIcon className="w-3 h-3" /> {d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
          {a.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {a.location}</span>}
          {a.case && <button onClick={onCase} className="text-primary hover:underline">{a.case.caseNumber}</button>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
        <button onClick={onDelete} className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
      </div>
    </motion.div>
  );
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return <div className="legal-card rounded-xl p-3 text-center"><p className={`text-2xl font-extrabold number-magnify ${color}`}>{value}</p><p className="text-[10px] text-muted-foreground mt-0.5">{label}</p></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>{children}</label>;
}
function Empty() { return <div className="text-center py-16"><CalendarDays className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">لا توجد مواعيد قادمة</p></div>; }

function buildCalendar(y: number, m: number, appts: any[]) {
  const first = new Date(y, m, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const eventSet = new Set(appts.map((a) => new Date(a.date).toDateString()));
  const cells: { day: number; date: Date; currentMonth: boolean; hasEvents: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) { const date = new Date(y, m - 1, prevDays - i); cells.push({ day: prevDays - i, date, currentMonth: false, hasEvents: eventSet.has(date.toDateString()) }); }
  for (let d = 1; d <= daysInMonth; d++) { const date = new Date(y, m, d); cells.push({ day: d, date, currentMonth: true, hasEvents: eventSet.has(date.toDateString()) }); }
  while (cells.length % 7 !== 0) { const d = cells.length - daysInMonth - startOffset + 1; const date = new Date(y, m + 1, d); cells.push({ day: d, date, currentMonth: false, hasEvents: eventSet.has(date.toDateString()) }); }
  return cells;
}
function shift({ y, m }: { y: number; m: number }, delta: number) { const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; }
function isToday(d: Date) { const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate(); }
