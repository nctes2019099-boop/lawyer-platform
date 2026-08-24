"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  ArrowRight, Phone, Mail, MapPin, Pencil, Trash2, X, Briefcase,
  CalendarDays, FileText, Activity, User, Check, Clock,
} from "lucide-react";
import { getInitials, formatIQD } from "@/lib/utils";
import { toast } from "react-hot-toast";

const tabs = [
  { key: "info", label: "معلومات", icon: User },
  { key: "cases", label: "القضايا", icon: Briefcase },
  { key: "documents", label: "المستندات", icon: FileText },
  { key: "appointments", label: "المواعيد", icon: CalendarDays },
  { key: "activities", label: "النشاطات", icon: Activity },
] as const;
type TabKey = (typeof tabs)[number]["key"];

export function ClientProfileScreen() {
  const { selectedClientId, goBack, navigate } = useAppStore();
  const [client, setClient] = useState<any | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("info");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => fetch(`/api/clients/${selectedClientId}`).then((r) => (r.ok ? r.json() : null)).then(setClient).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { if (selectedClientId) { setLoading(true); load(); } fetch("/api/clients").then((r) => r.json()).then((d) => setClients(Array.isArray(d) ? d : [])); /* eslint-disable-next-line */ }, [selectedClientId]);

  const stats = useMemo(() => {
    if (!client) return { cases: 0, active: 0, appointments: 0 };
    const cases = client.cases?.length || 0;
    const active = (client.cases || []).filter((c: any) => c.status !== "مكتملة").length;
    const appointments = client.appointments?.length || 0;
    return { cases, active, appointments };
  }, [client]);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/clients/${selectedClientId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) { toast.success("تم حذف الموكل"); goBack(); }
    else toast.error("فشل الحذف");
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  // Fallback list when no client selected
  if (!client) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={goBack} className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center"><ArrowRight className="w-5 h-5" /></button>
          <h1 className="font-bold">ملف الموكل</h1>
        </div>
        <p className="text-sm text-muted-foreground text-center py-10">اختر موكلاً لعرض ملفه</p>
        <div className="space-y-2">
          {clients.slice(0, 20).map((c) => (
            <button key={c.id} onClick={() => navigate("client-profile", { clientId: c.id })} className="w-full text-right legal-card rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">{getInitials(c.name || "؟")}</div>
              <span className="text-sm font-semibold">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 pb-28">
      <div className="flex items-center justify-between mb-4">
        <button onClick={goBack} className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center"><ArrowRight className="w-5 h-5" /></button>
        <h1 className="text-sm font-bold">ملف الموكل</h1>
        <div className="flex gap-1">
          <button onClick={() => setShowEdit(true)} className="w-9 h-9 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setShowDelete(true)} className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Profile hero */}
      <div className="brand-emerald rounded-3xl p-5 text-white text-center relative overflow-hidden shadow-xl shadow-primary/20 mb-4">
        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-white/10" />
        <div className="w-20 h-20 mx-auto rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center text-2xl font-extrabold mb-2">{getInitials(client.name || "؟")}</div>
        <h2 className="text-lg font-extrabold">{client.name}</h2>
        <span className="inline-block mt-1 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{client.category}</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <QuickStat value={stats.cases} label="قضايا" color="text-white" bg="bg-emerald-500" />
        <QuickStat value={stats.active} label="نشطة" color="text-white" bg="bg-amber-500" />
        <QuickStat value={stats.appointments} label="مواعيد" color="text-white" bg="bg-sky-500" />
      </div>

      {/* Contact */}
      <div className="legal-card rounded-2xl p-4 mb-4 space-y-2">
        {client.phone && (
          <a href={`tel:${client.phone}`} className="flex items-center gap-3 text-sm">
            <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Phone className="w-4 h-4" /></span>
            <span dir="ltr" className="flex-1">{client.phone}</span>
            <span className="text-primary text-xs font-semibold">اتصال</span>
          </a>
        )}
        {client.email && (
          <a href={`mailto:${client.email}`} className="flex items-center gap-3 text-sm">
            <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Mail className="w-4 h-4" /></span>
            <span dir="ltr" className="flex-1 truncate">{client.email}</span>
            <span className="text-primary text-xs font-semibold">بريد</span>
          </a>
        )}
        {(client.address || client.governorate) && (
          <div className="flex items-center gap-3 text-sm">
            <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><MapPin className="w-4 h-4" /></span>
            <span className="flex-1">{[client.address, client.governorate].filter(Boolean).join("، ")}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-4 overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 min-w-fit flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap px-2 ${tab === t.key ? "brand-emerald text-white shadow" : "text-muted-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === "info" && <InfoTab client={client} />}
          {tab === "cases" && <CasesTab cases={client.cases} navigate={navigate} />}
          {tab === "documents" && <DocumentsTab client={client} />}
          {tab === "appointments" && <AppointmentsTab appointments={client.appointments} />}
          {tab === "activities" && <ActivitiesTab client={client} />}
        </motion.div>
      </AnimatePresence>

      {showEdit && <EditClientDialog client={client} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); load(); }} />}

      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => !deleting && setShowDelete(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-bold mb-1">حذف الموكل</h3>
              <p className="text-sm text-muted-foreground mb-4">سيتم حذف الموكل {client.name}؟ لا يمكن التراجع.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDelete(false)} disabled={deleting} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm">إلغاء</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-semibold">{deleting ? "جارٍ..." : "حذف"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickStat({ value, label, bg }: { value: number; label: string; bg: string; color: string }) {
  return (
    <div className="legal-card rounded-xl p-3 text-center">
      <p className={`text-2xl font-extrabold number-magnify ${bg.replace("bg-", "text-")}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="text-[11px] text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="text-xs font-medium flex-1">{value}</span>
    </div>
  );
}

function InfoTab({ client }: { client: any }) {
  return (
    <div className="legal-card rounded-2xl p-4">
      <InfoRow label="الاسم" value={client.name} />
      <InfoRow label="الهاتف" value={client.phone} />
      <InfoRow label="البريد" value={client.email} />
      <InfoRow label="المحافظة" value={client.governorate} />
      <InfoRow label="العنوان" value={client.address} />
      <InfoRow label="التصنيف" value={client.category} />
      {client.notes && <InfoRow label="ملاحظات" value={client.notes} />}
    </div>
  );
}

function CasesTab({ cases, navigate }: { cases: any[]; navigate: any }) {
  if (!cases?.length) return <Empty text="لا توجد قضايا" />;
  return (
    <div className="space-y-2.5">
      {cases.map((c) => (
        <button key={c.id} onClick={() => navigate("case-details", { caseId: c.id })} className="w-full text-right legal-card rounded-xl p-3 flex items-center gap-3 hover-legal">
          <span className={`w-2.5 h-10 rounded-full ${c.status === "مكتملة" ? "bg-emerald-500" : "bg-amber-500"}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{c.title}</p>
            <p className="text-[10px] text-muted-foreground">#{c.caseNumber} • {c.status}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function DocumentsTab({ client }: { client: any }) {
  // Documents are linked to cases; show related transactions / case docs summary
  const docs = (client.cases || []).flatMap((c: any) => c.documents || []);
  if (!docs.length) return <Empty text="لا توجد مستندات" />;
  return (
    <div className="space-y-2">
      {docs.map((d: any) => <div key={d.id} className="legal-card rounded-xl p-3 flex items-center gap-3"><FileText className="w-4 h-4 text-primary" /><span className="text-sm font-medium">{d.title}</span></div>)}
    </div>
  );
}

function AppointmentsTab({ appointments }: { appointments: any[] }) {
  if (!appointments?.length) return <Empty text="لا توجد مواعيد" />;
  return (
    <div className="space-y-2.5">
      {[...appointments].sort((a, b) => +new Date(b.date) - +new Date(a.date)).map((a) => (
        <div key={a.id} className="legal-card rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0">
            <span className="text-[9px]">{new Date(a.date).toLocaleDateString("ar-EG", { month: "short" })}</span>
            <span className="text-sm font-extrabold leading-none">{new Date(a.date).getDate()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{a.title}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(a.date).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivitiesTab({ client }: { client: any }) {
  const tx = client.transactions || [];
  if (!tx.length) return <Empty text="لا توجد نشاطات مالية" />;
  const income = tx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + t.amount, 0);
  const expense = tx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="legal-card rounded-xl p-3"><p className="text-emerald-600 font-extrabold number-magnify">{formatIQD(income)}</p><p className="text-[10px] text-muted-foreground">إيرادات</p></div>
        <div className="legal-card rounded-xl p-3"><p className="text-rose-600 font-extrabold number-magnify">{formatIQD(expense)}</p><p className="text-[10px] text-muted-foreground">مصروفات</p></div>
      </div>
      {tx.map((t: any) => (
        <div key={t.id} className={`legal-card rounded-xl p-3 flex items-center gap-3 border-r-[3px] ${t.type === "income" ? "border-emerald-500" : "border-rose-500"}`}>
          <div className="flex-1"><p className="text-sm font-bold">{t.title}</p><p className="text-[10px] text-muted-foreground">{t.category}</p></div>
          <p className={`text-sm font-extrabold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "income" ? "+" : "−"}{formatIQD(t.amount)}</p>
        </div>
      ))}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-12 text-muted-foreground text-sm">{text}</div>;
}

function EditClientDialog({ client, onClose, onSaved }: { client: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: client.name || "", phone: client.phone || "", email: client.email || "", address: client.address || "", governorate: client.governorate || "", category: client.category || "عامة", notes: client.notes || "" });
  const [saving, setSaving] = useState(false);
  const cats = ["عامة", "خاصة", "VIP", "تجاري", "عقاري", "عمالي", "جنائي", "مدني", "أحوال شخصية"];
  const save = async () => {
    if (!form.name.trim()) return toast.error("الاسم مطلوب");
    setSaving(true);
    const res = await fetch(`/api/clients/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast.success("تم التحديث"); onSaved(); } else toast.error("فشل التحديث");
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between">
          <h3 className="font-bold">تعديل الموكل</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الاسم</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" dir="rtl" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الهاتف</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-input" dir="ltr" /></label>
            <label className="block"><span className="text-xs text-muted-foreground mb-1 block">البريد</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" dir="ltr" /></label>
          </div>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">التصنيف</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="form-input" dir="rtl">{cats.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">المحافظة</span><input value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} className="form-input" dir="rtl" /></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">العنوان</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-input" dir="rtl" /></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">ملاحظات</span><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="form-input resize-none" dir="rtl" /></label>
        </div>
        <div className="sticky bottom-0 p-4 border-t bg-card/95 backdrop-blur flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm">إلغاء</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold disabled:opacity-70">{saving ? "جارٍ..." : "حفظ"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
