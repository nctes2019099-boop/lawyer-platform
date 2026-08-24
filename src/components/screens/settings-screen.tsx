"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon, User, Shield, Bell, Moon, LogOut,
  Download, Upload, Database, Smartphone, Check, Pencil,
  CreditCard, HelpCircle, Mail, Phone, MapPin, Award, X,
  KeyRound, Eye, EyeOff, Trash2, FileText, Briefcase, Users,
  CalendarDays, StickyNote, Activity, Info, ChevronLeft,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getInitials, getRelativeTime } from "@/lib/utils";
import { toast } from "react-hot-toast";

export function SettingsScreen() {
  const { navigate, darkMode, setDarkMode } = useAppStore();
  const [profile, setProfile] = useState<any>(null);
  const [notif, setNotif] = useState({ email: true, push: true, sms: false, reminders: true });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", governorate: "", barMember: "" });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [storage, setStorage] = useState<string>("—");

  // sub-dialogs
  const [showPassword, setShowPassword] = useState(false);
  const [showData, setShowData] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile").then((r) => r.json()).then((p) => {
      setProfile(p);
      setForm({ name: p?.name || "", phone: p?.phone || "", governorate: p?.governorate || "", barMember: p?.barMember || "" });
    }).catch(() => {});
    estimateStorage();
  }, []);

  const estimateStorage = async () => {
    try {
      const [cases, clients, appts, notes] = await Promise.all([
        fetch("/api/cases?limit=200").then((r) => r.json()).catch(() => []),
        fetch("/api/clients?limit=200").then((r) => r.json()).catch(() => []),
        fetch("/api/appointments").then((r) => r.json()).catch(() => []),
        fetch("/api/notes").then((r) => r.json()).catch(() => []),
      ]);
      const bytes = JSON.stringify({ cases, clients, appts, notes }).length;
      setStorage(bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);
    } catch { setStorage("—"); }
  };

  const saveProfile = async () => {
    if (!form.name.trim()) return toast.error("الاسم مطلوب");
    setSaving(true);
    const res = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { setProfile(await res.json()); setEditing(false); toast.success("تم حفظ الملف"); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || "فشل الحفظ"); }
  };

  const exportBackup = () => { window.location.href = "/api/backup"; };
  const exportCsv = (type: string) => { window.location.href = `/api/export?type=${type}`; };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    try {
      const json = JSON.parse(await file.text());
      const res = await fetch("/api/backup/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(json) });
      if (res.ok) { toast.success("تمت الاستعادة بنجاح"); estimateStorage(); }
      else toast.error("فشل الاستعادة");
    } catch { toast.error("ملف غير صالح"); }
    setImporting(false);
    e.target.value = "";
  };

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; };

  return (
    <div className="max-w-lg mx-auto p-4 pb-28">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20"><SettingsIcon className="w-5 h-5 text-white" /></div>
        <div><h2 className="text-lg font-extrabold">الإعدادات</h2><p className="text-[11px] text-muted-foreground">حسابك وتفضيلاتك</p></div>
      </div>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="legal-card rounded-2xl p-4 mb-4">
        {!editing ? (
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl brand-emerald flex items-center justify-center text-white text-xl font-extrabold shrink-0">{getInitials(profile?.name || "؟")}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">{profile?.name || profile?.email || "المستخدم"}</h3>
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1" dir="ltr"><Mail className="w-3 h-3" />{profile?.email}</p>
              {profile?.phone && <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1" dir="ltr"><Phone className="w-3 h-3" />{profile.phone}</p>}
              {profile?.isAdmin && <span className="inline-block mt-1 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">مسؤول</span>}
            </div>
            <button onClick={() => setEditing(true)} className="w-9 h-9 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center"><Pencil className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1"><h3 className="font-bold">تعديل الملف الشخصي</h3><button onClick={() => setEditing(false)} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button></div>
            <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الاسم</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" dir="rtl" /></label>
            <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الهاتف</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="07XXXXXXXXX" className="form-input" dir="ltr" /></label>
            <label className="block"><span className="text-xs text-muted-foreground mb-1 block">المحافظة</span><input value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} className="form-input" dir="rtl" /></label>
            <label className="block"><span className="text-xs text-muted-foreground mb-1 block">رقم نقابة المحامين</span><input value={form.barMember} onChange={(e) => setForm({ ...form, barMember: e.target.value })} className="form-input" dir="ltr" /></label>
            <button onClick={saveProfile} disabled={saving} className="w-full py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"><Check className="w-4 h-4" /> {saving ? "جارٍ..." : "حفظ"}</button>
          </div>
        )}
      </motion.div>

      <Section title="الحساب" icon={<User className="w-4 h-4" />}>
        <Item icon={<Award className="w-4 h-4" />} label="رقم نقابة المحامين" value={profile?.barMember || "—"} />
        <Item icon={<MapPin className="w-4 h-4" />} label="المحافظة" value={profile?.governorate || "—"} />
        <Item icon={<KeyRound className="w-4 h-4" />} label="تغيير كلمة المرور" onClick={() => setShowPassword(true)} chevron />
      </Section>

      <Section title="الإشعارات" icon={<Bell className="w-4 h-4" />}>
        <Toggle label="إشعارات البريد" checked={notif.email} onChange={(v) => setNotif({ ...notif, email: v })} />
        <Toggle label="إشعارات الدفع" checked={notif.push} onChange={(v) => setNotif({ ...notif, push: v })} />
        <Toggle label="رسائل SMS" checked={notif.sms} onChange={(v) => setNotif({ ...notif, sms: v })} />
        <Toggle label="تذكيرات المواعيد" checked={notif.reminders} onChange={(v) => setNotif({ ...notif, reminders: v })} />
      </Section>

      <Section title="المظهر والتطبيق" icon={<Moon className="w-4 h-4" />}>
        <Toggle icon={<Moon className="w-4 h-4" />} label="الوضع الداكن" checked={darkMode} onChange={setDarkMode} />
        <Item icon={<Smartphone className="w-4 h-4" />} label="تثبيت التطبيق" value={<button className="text-primary text-xs font-semibold" onClick={() => toast("افتح قائمة المتصفح → إضافة للشاشة الرئيسية")}>تثبيت</button>} />
      </Section>

      <Section title="البيانات والنسخ الاحتياطي" icon={<Database className="w-4 h-4" />}>
        <Item icon={<Download className="w-4 h-4" />} label="تصدير نسخة احتياطية (JSON)" value={<button className="text-primary text-xs font-semibold" onClick={exportBackup}>تصدير</button>} />
        <Item icon={<FileText className="w-4 h-4" />} label="تصدير القضايا (CSV)" value={<button className="text-primary text-xs font-semibold" onClick={() => exportCsv("cases")}>CSV</button>} />
        <Item icon={<Users className="w-4 h-4" />} label="تصدير الموكلين (CSV)" value={<button className="text-primary text-xs font-semibold" onClick={() => exportCsv("clients")}>CSV</button>} />
        <Item icon={<Upload className="w-4 h-4" />} label="استيراد نسخة احتياطية" value={
          <label className="text-primary text-xs font-semibold cursor-pointer">{importing ? "..." : "اختيار ملف"}<input type="file" accept="application/json" className="hidden" onChange={handleImport} /></label>
        } />
        <Item icon={<Database className="w-4 h-4" />} label="إدارة البيانات" value={<button className="text-primary text-xs font-semibold" onClick={() => setShowData(true)}>فتح</button>} chevron />
        <Item icon={<Database className="w-4 h-4" />} label="التخزين المستخدم" value={storage} />
      </Section>

      <Section title="سجل التدقيق" icon={<Activity className="w-4 h-4" />}>
        <Item icon={<Activity className="w-4 h-4" />} label="عرض سجل النشاطات" value={<button className="text-primary text-xs font-semibold" onClick={() => setShowAudit(true)}>عرض</button>} chevron />
      </Section>

      <Section title="الاشتراك" icon={<CreditCard className="w-4 h-4" />}>
        <Item icon={<CreditCard className="w-4 h-4" />} label="إدارة الاشتراك" value={<button className="text-primary text-xs font-semibold" onClick={() => navigate("subscriptions")}>الاشتراكات</button>} chevron />
      </Section>

      {profile?.isAdmin && (
        <Section title="المسؤول" icon={<Shield className="w-4 h-4" />}>
          <Item icon={<Shield className="w-4 h-4" />} label="لوحة الإدارة" value={<button className="text-primary text-xs font-semibold" onClick={() => navigate("admin")}>فتح ←</button>} chevron />
        </Section>
      )}

      <Section title="الدعم والأمان" icon={<HelpCircle className="w-4 h-4" />}>
        <a href="mailto:support@mizan.app" className="block"><Item icon={<Mail className="w-4 h-4" />} label="الدعم الفني" value="support@mizan.app" /></a>
        <Item icon={<Info className="w-4 h-4" />} label="حول التطبيق" value={<button className="text-primary text-xs font-semibold" onClick={() => setShowAbout(true)}>عرض</button>} chevron />
        <Item icon={<Trash2 className="w-4 h-4" />} label="حذف الحساب" value={<button className="text-destructive text-xs font-semibold" onClick={() => setShowDelete(true)}>حذف</button>} chevron danger />
      </Section>

      <button onClick={logout} className="w-full mt-4 py-3 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors">
        <LogOut className="w-4 h-4" /> تسجيل الخروج
      </button>

      <p className="text-center text-[10px] text-muted-foreground/60 mt-6">ميزان للإدارة القانونية v2.0</p>

      <PasswordDialog open={showPassword} onClose={() => setShowPassword(false)} />
      <DataDialog open={showData} onClose={() => setShowData(false)} onExport={exportBackup} onImported={estimateStorage} />
      <AuditDialog open={showAudit} onClose={() => setShowAudit(false)} />
      <AboutDialog open={showAbout} onClose={() => setShowAbout(false)} />
      <DeleteDialog open={showDelete} onClose={() => setShowDelete(false)} onDeleted={logout} />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="legal-card rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2 text-primary">{icon}<h3 className="text-xs font-bold">{title}</h3></div>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}
function Item({ icon, label, value, onClick, chevron, danger }: { icon?: React.ReactNode; label: string; value?: React.ReactNode; onClick?: () => void; chevron?: boolean; danger?: boolean }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 py-3 first:pt-1 last:pb-1 ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}>
      {icon && <span className={`w-5 flex justify-center ${danger ? "text-destructive" : "text-muted-foreground"}`}>{icon}</span>}
      <span className={`text-sm flex-1 ${danger ? "text-destructive" : ""}`}>{label}</span>
      <span className="text-xs text-muted-foreground flex items-center gap-1">{value}{chevron && <ChevronLeft className="w-3.5 h-3.5" />}</span>
    </div>
  );
}
function Toggle({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
      {icon && <span className="text-muted-foreground w-5 flex justify-center">{icon}</span>}
      <span className="text-sm flex-1">{label}</span>
      <button onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-primary" : "bg-secondary"}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? "right-0.5" : "right-[22px]"}`} />
      </button>
    </div>
  );
}

function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between"><h3 className="font-bold">{title}</h3><button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button></div>
            <div className="p-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!open) { setCurrent(""); setNext(""); setConfirm(""); setShow(false); } }, [open]);

  const submit = async () => {
    if (next.length < 6) return toast.error("كلمة المرور الجديدة 6 أحرف على الأقل");
    if (next !== confirm) return toast.error("كلمتا المرور غير متطابقتين");
    setSaving(true);
    const res = await fetch("/api/user/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: current, newPassword: next }) });
    setSaving(false);
    if (res.ok) { toast.success("تم تغيير كلمة المرور"); onClose(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || "فشل"); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="تغيير كلمة المرور">
      <div className="space-y-3">
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">كلمة المرور الحالية</span>
          <div className="relative"><input type={show ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)} className="form-input pl-10" dir="ltr" />
            <button type="button" onClick={() => setShow(!show)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
        </label>
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">كلمة المرور الجديدة</span><input type={show ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)} className="form-input" dir="ltr" /></label>
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">تأكيد كلمة المرور</span><input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="form-input" dir="ltr" /></label>
        <button onClick={submit} disabled={saving} className="w-full py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold disabled:opacity-70">{saving ? "..." : "تغيير كلمة المرور"}</button>
      </div>
    </Sheet>
  );
}

function DataDialog({ open, onClose, onExport, onImported }: { open: boolean; onClose: () => void; onExport: () => void; onImported: () => void }) {
  const [importing, setImporting] = useState(false);
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    try {
      const json = JSON.parse(await file.text());
      const res = await fetch("/api/backup/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(json) });
      if (res.ok) { toast.success("تمت الاستعادة"); onImported(); }
      else toast.error("فشل الاستعادة");
    } catch { toast.error("ملف غير صالح"); }
    setImporting(false); e.target.value = "";
  };
  return (
    <Sheet open={open} onClose={onClose} title="إدارة البيانات">
      <div className="space-y-3">
        <button onClick={onExport} className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary text-right"><Download className="w-5 h-5 text-primary" /><div><p className="text-sm font-semibold">تصدير كل البيانات</p><p className="text-[11px] text-muted-foreground">نسخة JSON كاملة</p></div></button>
        <label className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary cursor-pointer">
          <Upload className="w-5 h-5 text-primary" /><div className="flex-1"><p className="text-sm font-semibold">استيراد بيانات</p><p className="text-[11px] text-muted-foreground">{importing ? "جارٍ..." : "من ملف JSON"}</p></div>
          <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </label>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-[11px] text-amber-800 dark:text-amber-300">
          ملاحظة: الاستيراد سيضيف البيانات من الملف. يُنصح بأخذ نسخة احتياطية أولاً.
        </div>
      </div>
    </Sheet>
  );
}

function AuditDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/audit?limit=100").then((r) => r.json()).then((d) => setLogs(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
    }
  }, [open]);
  const actionIcon = (action: string) => {
    if (action.includes("CREATE") || action.includes("إنشاء")) return <span className="text-emerald-600">✓</span>;
    if (action.includes("DELETE") || action.includes("حذف")) return <span className="text-rose-600">🗑</span>;
    if (action.includes("UPDATE") || action.includes("تعديل")) return <span className="text-amber-600">✏️</span>;
    if (action.includes("LOGIN") || action.includes("دخول")) return <span className="text-sky-600">🔐</span>;
    return <span className="text-muted-foreground">•</span>;
  };
  return (
    <Sheet open={open} onClose={onClose} title="سجل التدقيق">
      {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-secondary/50 animate-pulse" />)}</div> : logs.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">لا يوجد نشاط مسجل</p>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40">
              <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center shrink-0">{actionIcon(l.action)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{l.action} {l.entity && <span className="text-muted-foreground">· {l.entity}</span>}</p>
                {l.details && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{l.details}</p>}
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{getRelativeTime(l.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="حول التطبيق">
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto rounded-2xl brand-emerald flex items-center justify-center text-white text-3xl mb-3">⚖️</div>
        <h3 className="text-lg font-extrabold">ميزان — محامي محترف</h3>
        <p className="text-xs text-muted-foreground mt-1">نظام إدارة مكاتب المحاماة</p>
        <p className="text-xs text-primary font-semibold mt-2">الإصدار 2.0</p>
        <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
          <p>إدارة القضايا والموكلين والمواعيد</p>
          <p>العرائض والمستندات والقوانين</p>
          <p>المالية والإحصائيات والنسخ الاحتياطي</p>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-6">صُنع بـ ❤️ في العراق</p>
      </div>
    </Sheet>
  );
}

function DeleteDialog({ open, onClose, onDeleted }: { open: boolean; onClose: () => void; onDeleted: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (!open) { setPassword(""); setConfirm(""); } }, [open]);
  const submit = async () => {
    setLoading(true);
    const res = await fetch("/api/user/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, confirmation: confirm }) });
    setLoading(false);
    if (res.ok) { toast.success("تم حذف الحساب"); onDeleted(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || "فشل الحذف"); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="حذف الحساب">
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-[11px] text-rose-800 dark:text-rose-300">
          تحذير: سيتم حذف حسابك وجميع بياناتك نهائياً (قضايا، موكلين، مواعيد...). لا يمكن التراجع.
        </div>
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">كلمة المرور</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" dir="ltr" /></label>
        <label className="block"><span className="text-xs text-muted-foreground mb-1 block">اكتب "حذف" للتأكيد</span><input value={confirm} onChange={(e) => setConfirm(e.target.value)} className="form-input" dir="rtl" /></label>
        <button onClick={submit} disabled={loading || confirm !== "حذف" || !password} className="w-full py-2.5 rounded-xl bg-destructive text-white text-sm font-semibold disabled:opacity-50">{loading ? "..." : "حذف الحساب نهائياً"}</button>
      </div>
    </Sheet>
  );
}
