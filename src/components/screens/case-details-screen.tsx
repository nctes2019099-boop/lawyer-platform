"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  ArrowRight, Gavel, MapPin, User, Calendar, Clock, FileText, ScrollText,
  Activity, Plus, Pencil, Trash2, Share2, Copy, Check, Phone, Mail, X,
  CircleDot,
} from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { toast } from "react-hot-toast";

const tabs = [
  { key: "sessions", label: "الجلسات", icon: Calendar },
  { key: "documents", label: "المستندات", icon: FileText },
  { key: "petitions", label: "العرائض", icon: ScrollText },
  { key: "activities", label: "النشاطات", icon: Activity },
] as const;
type TabKey = (typeof tabs)[number]["key"];

const sessionStatusCfg: Record<string, { color: string; bg: string; label: string }> = {
  قادمة: { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30", label: "قادمة" },
  منعقدة: { color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/30", label: "منعقدة" },
  مؤجلة: { color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-950/30", label: "مؤجلة" },
  ملغية: { color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800", label: "ملغية" },
};

const docIcon: Record<string, string> = {
  عقد: "📋", حكم: "⚖️", إثبات: "📎", مذكرة: "📝", وثيقة: "📄", صك: "📜",
};

export function CaseDetailsScreen() {
  const { selectedCaseId, goBack, navigate } = useAppStore();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("sessions");
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () =>
    fetch(`/api/cases/${selectedCaseId}`).then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { if (selectedCaseId) { setLoading(true); load(); } /* eslint-disable-next-line */ }, [selectedCaseId]);

  const nextSession = useMemo(() => {
    if (!data?.sessions) return null;
    const now = new Date();
    return data.sessions.filter((s: any) => new Date(s.date) >= now).sort((a: any, b: any) => +new Date(a.date) - +new Date(b.date))[0] || null;
  }, [data]);

  const caseAge = useMemo(() => {
    if (!data?.createdAt) return 0;
    return Math.max(0, Math.round((Date.now() - new Date(data.createdAt).getTime()) / 86400000));
  }, [data]);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/cases/${selectedCaseId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) { toast.success("تم حذف القضية"); goBack(); }
    else toast.error("فشل الحذف");
  };

  const share = async () => {
    const text = `قضية ${data?.caseNumber}: ${data?.title}${data?.court ? ` — ${data.court}` : ""}`;
    try {
      if (navigator.share) await navigator.share({ title: "مشاركة قضية", text });
      else { await navigator.clipboard.writeText(text); toast.success("تم نسخ بيانات القضية"); }
    } catch { /* cancelled */ }
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-center py-20 text-muted-foreground">تعذّر تحميل القضية</div>;

  return (
    <div className="max-w-lg mx-auto p-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={goBack} className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center"><ArrowRight className="w-5 h-5" /></button>
        <h1 className="text-sm font-bold">تفاصيل القضية</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowEdit(true)} className="w-9 h-9 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center" title="تعديل"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setShowDelete(true)} className="w-9 h-9 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center" title="حذف"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="brand-emerald rounded-3xl p-5 text-white relative overflow-hidden shadow-xl shadow-primary/20 mb-4">
        <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs bg-white/20 px-2 py-0.5 rounded">#{data.caseNumber}</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded flex items-center gap-1"><Gavel className="w-3 h-3" /> {data.type}</span>
          </div>
          <h2 className="text-lg font-extrabold leading-snug">{data.title}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[11px] text-white/85">
            {data.court && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {data.court}</span>}
            {data.priority && <span className="flex items-center gap-1"><CircleDot className="w-3 h-3" /> {data.priority}</span>}
            {nextSession ? (
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> جلسة {new Date(nextSession.date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })} {new Date(nextSession.date).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
            ) : <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {caseAge} يوم</span>}
          </div>
          {data.client && (
            <button onClick={() => navigate("client-profile", { clientId: data.client.id })} className="mt-3 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl px-3 py-1.5 text-xs font-semibold">
              <User className="w-3.5 h-3.5" /> {data.client.name}
            </button>
          )}
        </div>
      </motion.div>

      {/* Info card */}
      <div className="legal-card rounded-2xl p-4 mb-4 space-y-2 text-sm">
        <InfoRow icon={<Gavel className="w-4 h-4 text-primary" />} label="رقم القضية" value={data.caseNumber} copyable />
        {data.court && <InfoRow icon={<MapPin className="w-4 h-4 text-primary" />} label="المحكمة" value={data.court} />}
        {data.judge && <InfoRow icon={<User className="w-4 h-4 text-primary" />} label="القاضي" value={data.judge} />}
        <InfoRow icon={<Calendar className="w-4 h-4 text-primary" />} label="تاريخ الإنشاء" value={new Date(data.createdAt).toLocaleDateString("ar-EG")} />
        {data.description && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-[11px] text-muted-foreground mb-1">الوصف</p>
            <p className="text-xs leading-relaxed">{data.description}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-4 overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all ${tab === t.key ? "brand-emerald text-white shadow" : "text-muted-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
            <span className="opacity-70">
              {t.key === "sessions" ? data.sessions?.length : t.key === "documents" ? data.documents?.length : t.key === "petitions" ? data.petitions?.length : (data.appointments?.length || 0)}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === "sessions" && (
            <div className="space-y-3">
              {data.sessions?.length ? (
                <div className="relative pr-2">
                  <span className="absolute right-[7px] top-2 bottom-2 w-0.5 bg-border" />
                  {data.sessions.map((s: any, i: number) => {
                    const cfg = sessionStatusCfg[s.status] || sessionStatusCfg["قادمة"];
                    return (
                      <div key={s.id} className="relative flex gap-3 mb-4">
                        <span className={`relative z-10 w-4 h-4 rounded-full border-2 border-background mt-1 shrink-0 ${i === data.sessions.length - 1 ? "bg-primary" : "bg-secondary"}`} />
                        <div className="flex-1 legal-card rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">{new Date(s.date).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "short" })}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{new Date(s.date).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}{s.location ? ` • ${s.location}` : ""}</p>
                          {s.notes && <p className="text-[11px] mt-1.5 leading-relaxed">{s.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyTab text="لا توجد جلسات" />}
            </div>
          )}

          {tab === "documents" && (
            <div className="space-y-2">
              {data.documents?.length ? data.documents.map((d: any) => (
                <a key={d.id} href={d.fileUrl || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-3 legal-card rounded-xl p-3 hover-legal">
                  <span className="text-2xl">{docIcon[d.type] || "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{d.title}</p>
                    <p className="text-[10px] text-muted-foreground">{d.type}{d.fileSize ? ` • ${d.fileSize}` : ""}</p>
                  </div>
                </a>
              )) : <EmptyTab text="لا توجد مستندات" />}
            </div>
          )}

          {tab === "petitions" && (
            <div className="space-y-2">
              {data.petitions?.length ? data.petitions.map((p: any) => (
                <div key={p.id} className="legal-card rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold">{p.title}</p>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p.type}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{p.content}</p>
                </div>
              )) : <EmptyTab text="لا توجد عرائض" />}
            </div>
          )}

          {tab === "activities" && (
            <div className="space-y-2">
              {data.appointments?.length ? data.appointments.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 legal-card rounded-xl p-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Calendar className="w-4 h-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(a.date).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}</p>
                  </div>
                </div>
              )) : <EmptyTab text="لا توجد نشاطات" />}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Action bar */}
      <div className="fixed bottom-[88px] inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
        <div className="w-full max-w-lg glass-legal rounded-2xl p-1.5 flex gap-1.5 shadow-lg border border-border/60 pointer-events-auto">
          <ActionBarBtn icon={<Plus className="w-4 h-4" />} label="جلسة" onClick={() => setShowAddSession(true)} />
          <ActionBarBtn icon={<FileText className="w-4 h-4" />} label="مستند" onClick={() => setShowAddDoc(true)} />
          <ActionBarBtn icon={<Pencil className="w-4 h-4" />} label="تعديل" onClick={() => setShowEdit(true)} />
          <ActionBarBtn icon={<Share2 className="w-4 h-4" />} label="مشاركة" onClick={share} />
        </div>
      </div>

      {showAddSession && <AddSessionDialog caseId={data.id} onClose={() => setShowAddSession(false)} onSaved={() => { setShowAddSession(false); load(); }} />}
      {showAddDoc && <AddDocDialog caseId={data.id} onClose={() => setShowAddDoc(false)} onSaved={() => { setShowAddDoc(false); load(); }} />}
      {showEdit && <EditCaseDialog caseData={data} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); load(); }} />}

      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => !deleting && setShowDelete(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center"><Trash2 className="w-5 h-5 text-destructive" /></div>
                <div><h3 className="font-bold">حذف القضية</h3><p className="text-sm text-muted-foreground">سيتم حذف القضية وكل ما يرتبط بها.</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowDelete(false)} disabled={deleting} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm font-medium">إلغاء</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-semibold">{deleting ? "جارٍ..." : "تأكيد الحذف"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ icon, label, value, copyable }: { icon: React.ReactNode; label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-[11px] text-muted-foreground w-20">{label}</span>
      <span className="text-xs font-semibold flex-1" dir={copyable ? "ltr" : "rtl"}>{value}</span>
      {copyable && (
        <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); toast.success("تم النسخ"); setTimeout(() => setCopied(false), 1500); }} className="text-muted-foreground hover:text-primary">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}

function ActionBarBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 py-2 rounded-xl hover:bg-secondary flex flex-col items-center gap-0.5 text-[10px] font-semibold text-muted-foreground">
      {icon}{label}
    </button>
  );
}

function EmptyTab({ text }: { text: string }) {
  return <div className="text-center py-12"><FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">{text}</p></div>;
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function AddSessionDialog({ caseId, onClose, onSaved }: { caseId: string; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [status, setStatus] = useState("قادمة");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/sessions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, date: new Date(`${date}T${time}:00`).toISOString(), location, status, notes }),
    });
    setSaving(false);
    if (res.ok) { toast.success("تمت إضافة الجلسة"); onSaved(); } else toast.error("فشل الحفظ");
  };

  return (
    <Sheet title="إضافة جلسة" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">التاريخ</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="form-input" dir="ltr" /></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الوقت</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="form-input" dir="ltr" /></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الحالة</span><select value={status} onChange={(e) => setStatus(e.target.value)} className="form-input" dir="rtl">{Object.keys(sessionStatusCfg).map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">المكان</span><input value={location} onChange={(e) => setLocation(e.target.value)} className="form-input" dir="rtl" /></label>
        </div>
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">ملاحظات</span><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input resize-none" dir="rtl" /></label>
        <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold disabled:opacity-70">{saving ? "جارٍ..." : "حفظ الجلسة"}</button>
      </div>
    </Sheet>
  );
}

function AddDocDialog({ caseId, onClose, onSaved }: { caseId: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("وثيقة");
  const [fileUrl, setFileUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const docTypes = ["عقد", "حكم", "إثبات", "مذكرة", "وثيقة", "صك"];

  const save = async () => {
    if (!title.trim()) return toast.error("العنوان مطلوب");
    setSaving(true);
    const res = await fetch("/api/documents", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, type, caseId, fileUrl: fileUrl || undefined }),
    });
    setSaving(false);
    if (res.ok) { toast.success("تمت إضافة المستند"); onSaved(); } else toast.error("فشل الحفظ");
  };

  return (
    <Sheet title="إضافة مستند" onClose={onClose}>
      <div className="space-y-3">
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">العنوان *</span><input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" dir="rtl" /></label>
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">النوع</span><select value={type} onChange={(e) => setType(e.target.value)} className="form-input" dir="rtl">{docTypes.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">رابط الملف (اختياري)</span><input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." className="form-input" dir="ltr" /></label>
        <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold disabled:opacity-70">{saving ? "جارٍ..." : "حفظ المستند"}</button>
      </div>
    </Sheet>
  );
}

function EditCaseDialog({ caseData, onClose, onSaved }: { caseData: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: caseData.title, caseNumber: caseData.caseNumber, type: caseData.type, status: caseData.status, priority: caseData.priority, court: caseData.court || "", judge: caseData.judge || "", description: caseData.description || "" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/cases/${caseData.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast.success("تم التحديث"); onSaved(); } else toast.error("فشل التحديث");
  };
  return (
    <Sheet title="تعديل القضية" onClose={onClose}>
      <div className="space-y-3">
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الرقم</span><input value={form.caseNumber} onChange={(e) => setForm({ ...form, caseNumber: e.target.value })} className="form-input" dir="ltr" /></label>
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">العنوان</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="form-input" dir="rtl" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">النوع</span><input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="form-input" dir="rtl" /></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الأولوية</span><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="form-input" dir="rtl">{["عادية", "مهمة", "عاجلة", "حرجة"].map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الحالة</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-input" dir="rtl">{["قيد النظر", "جاري التنفيذ", "مكتملة", "مؤجلة", "مرفوضة"].map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">المحكمة</span><input value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} className="form-input" dir="rtl" /></label>
        </div>
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">القاضي</span><input value={form.judge} onChange={(e) => setForm({ ...form, judge: e.target.value })} className="form-input" dir="rtl" /></label>
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الوصف</span><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-input resize-none" dir="rtl" /></label>
        <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold disabled:opacity-70">{saving ? "جارٍ..." : "حفظ التعديلات"}</button>
      </div>
    </Sheet>
  );
}
