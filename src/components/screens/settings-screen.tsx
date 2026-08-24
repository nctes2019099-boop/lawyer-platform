"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon, User, Shield, Bell, Moon, LogOut,
  Download, Upload, Database, Smartphone, Trash2, Check, Pencil,
  CreditCard, HelpCircle, Mail, Phone, MapPin, Award, X,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getInitials } from "@/lib/utils";
import { toast } from "react-hot-toast";

export function SettingsScreen() {
  const { navigate, darkMode, setDarkMode, setDialogOpen } = useAppStore();
  const [profile, setProfile] = useState<any>(null);
  const [notif, setNotif] = useState({ email: true, push: true, sms: false, reminders: true });
  const [security, setSecurity] = useState({ twoFactor: false });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", governorate: "", barMember: "" });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile").then((r) => r.json()).then((p) => {
      setProfile(p);
      setForm({ name: p?.name || "", phone: p?.phone || "", governorate: p?.governorate || "", barMember: p?.barMember || "" });
    }).catch(() => {});
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const res = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { setProfile(await res.json()); setEditing(false); toast.success("تم حفظ الملف"); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || "فشل الحفظ"); }
  };

  const exportBackup = () => { window.location.href = "/api/backup"; };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    try {
      const text = await file.text(); const json = JSON.parse(text);
      const res = await fetch("/api/backup/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(json) });
      if (res.ok) toast.success("تمت الاستعادة بنجاح"); else toast.error("فشل الاستعادة");
    } catch { toast.error("ملف غير صالح"); }
    setImporting(false);
    e.target.value = "";
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

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
        <Row icon={<Award className="w-4 h-4" />} label="رقم نقابة المحامين" value={profile?.barMember || "—"} />
        <Row icon={<MapPin className="w-4 h-4" />} label="المحافظة" value={profile?.governorate || "—"} />
      </Section>

      <Section title="الإشعارات" icon={<Bell className="w-4 h-4" />}>
        <ToggleRow label="إشعارات البريد" checked={notif.email} onChange={(v) => setNotif({ ...notif, email: v })} />
        <ToggleRow label="إشعارات الدفع" checked={notif.push} onChange={(v) => setNotif({ ...notif, push: v })} />
        <ToggleRow label="رسائل SMS" checked={notif.sms} onChange={(v) => setNotif({ ...notif, sms: v })} />
        <ToggleRow label="تذكيرات المواعيد" checked={notif.reminders} onChange={(v) => setNotif({ ...notif, reminders: v })} />
      </Section>

      <Section title="المظهر والتطبيق" icon={<Moon className="w-4 h-4" />}>
        <ToggleRow icon={<Moon className="w-4 h-4" />} label="الوضع الداكن" checked={darkMode} onChange={setDarkMode} />
        <Row icon={<Smartphone className="w-4 h-4" />} label="تثبيت التطبيق" value={<button className="text-primary text-xs font-semibold" onClick={() => toast("افتح قائمة المتصفح → إضافة للشاشة الرئيسية")}>تثبيت</button>} />
      </Section>

      <Section title="النسخ الاحتياطي" icon={<Database className="w-4 h-4" />}>
        <Row icon={<Download className="w-4 h-4" />} label="تصدير نسخة احتياطية" value={<button className="text-primary text-xs font-semibold" onClick={exportBackup}>تصدير JSON</button>} />
        <Row icon={<Upload className="w-4 h-4" />} label="استيراد نسخة" value={
          <label className="text-primary text-xs font-semibold cursor-pointer">
            {importing ? "جارٍ..." : "اختيار ملف"}
            <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </label>
        } />
      </Section>

      <Section title="الاشتراك" icon={<CreditCard className="w-4 h-4" />}>
        <Row icon={<CreditCard className="w-4 h-4" />} label="إدارة الاشتراك" value={<button className="text-primary text-xs font-semibold" onClick={() => navigate("subscriptions")}>الاشتراكات</button>} />
      </Section>

      <Section title="الأمان" icon={<Shield className="w-4 h-4" />}>
        <ToggleRow label="المصادقة الثنائية (2FA)" checked={security.twoFactor} onChange={(v) => { setSecurity({ ...security, twoFactor: v }); if (v) toast("تفعيل 2FA قريباً"); }} />
      </Section>

      <Section title="الدعم" icon={<HelpCircle className="w-4 h-4" />}>
        <a href="mailto:support@mizan.app" className="block"><Row icon={<Mail className="w-4 h-4" />} label="الدعم الفني" value="support@mizan.app" /></a>
      </Section>

      {profile?.isAdmin && (
        <Section title="المسؤول" icon={<Shield className="w-4 h-4" />}>
          <button onClick={() => navigate("admin")} className="w-full text-right">
            <Row icon={<Shield className="w-4 h-4" />} label="لوحة الإدارة" value={<span className="text-primary text-xs">فتح ←</span>} />
          </button>
        </Section>
      )}

      <button onClick={logout} className="w-full mt-4 py-3 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors">
        <LogOut className="w-4 h-4" /> تسجيل الخروج
      </button>

      <p className="text-center text-[10px] text-muted-foreground/60 mt-6">ميزان للإدارة القانونية v2.0</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="legal-card rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2 text-primary">
        {icon}
        <h3 className="text-xs font-bold">{title}</h3>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
      {icon && <span className="text-muted-foreground w-5 flex justify-center">{icon}</span>}
      <span className="text-sm flex-1">{label}</span>
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

function ToggleRow({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }) {
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
