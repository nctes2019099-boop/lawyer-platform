"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Users, Package, CreditCard, Plus, Pencil, Trash2, X,
  Check, Shield, ShieldOff, Search, ChevronLeft, ChevronRight,
  UserPlus, TrendingUp, Briefcase,
} from "lucide-react";
import { getInitials, formatIQD } from "@/lib/utils";
import { toast } from "react-hot-toast";

const tabs = [
  { key: "users", label: "المستخدمون", icon: Users },
  { key: "plans", label: "الخطط", icon: Package },
  { key: "payments", label: "المدفوعات", icon: CreditCard },
] as const;
type TabKey = (typeof tabs)[number]["key"];

export function AdminScreen() {
  const [tab, setTab] = useState<TabKey>("users");
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => { if (r.status === 403) setForbidden(true); return r.json(); }).then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (forbidden) {
    return (
      <div className="max-w-lg mx-auto p-4 text-center py-20">
        <Shield className="w-16 h-16 mx-auto mb-4 text-destructive/40" />
        <h2 className="text-lg font-bold mb-1">وصول محظور</h2>
        <p className="text-sm text-muted-foreground">هذه اللوحة للمسؤولين فقط.</p>
      </div>
    );
  }

  const revenue = stats?.revenue || 0;

  return (
    <div className="max-w-lg mx-auto p-4 pb-28">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20"><Crown className="w-5 h-5 text-white" /></div>
        <div><h2 className="text-lg font-extrabold">لوحة الإدارة</h2><p className="text-[11px] text-muted-foreground">إدارة المستخدمين والاشتراكات</p></div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <StatTile icon={<Users className="w-4 h-4" />} value={stats?.totalUsers ?? 0} label="مستخدم" color="text-sky-600" bg="bg-sky-500" />
        <StatTile icon={<Package className="w-4 h-4" />} value={stats?.totalSubscriptions ?? 0} label="اشتراك" color="text-purple-600" bg="bg-purple-500" />
        <StatTile icon={<TrendingUp className="w-4 h-4" />} value={formatIQD(revenue)} label="الإيرادات" color="text-emerald-600" bg="bg-emerald-500" small />
      </div>

      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-4">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all ${tab === t.key ? "brand-emerald text-white shadow" : "text-muted-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="h-40 rounded-2xl bg-secondary/50 animate-pulse" /> : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {tab === "users" && <UsersManager />}
            {tab === "plans" && <PlansManager />}
            {tab === "payments" && <PaymentsManager />}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function StatTile({ icon, value, label, color, bg, small }: { icon: React.ReactNode; value: any; label: string; color: string; bg: string; small?: boolean }) {
  return (
    <div className="legal-card rounded-xl p-3 relative overflow-hidden">
      <span className={`absolute top-0 right-0 w-1 h-full ${bg}`} />
      <div className={`mb-1 ${color}`}>{icon}</div>
      <p className={`font-extrabold number-magnify ${small ? "text-sm" : "text-xl"} ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* ---------- USERS ---------- */
function UsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const pageSize = 10;

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/users?limit=${pageSize}&offset=${(page - 1) * pageSize}${q ? `&q=${encodeURIComponent(q)}` : ""}`)
      .then((r) => r.json()).then((d) => { setUsers(d.users || []); setTotal(d.total || 0); })
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const search = () => { setPage(1); load(); };

  const toggleAdmin = async (u: any) => {
    const prev = users;
    setUsers((p) => p.map((x) => x.id === u.id ? { ...x, isAdmin: !x.isAdmin } : x));
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAdmin: !u.isAdmin }) });
    if (!res.ok) { setUsers(prev); const e = await res.json().catch(() => ({})); toast.error(e.error || "فشل"); }
    else toast.success(u.isAdmin ? "أُزيلت صلاحية المسؤول" : "مُنح صلاحية المسؤول");
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("تم الحذف"); load(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || "فشل الحذف"); }
  };

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="بحث بالاسم أو البريد..." className="form-input pr-10" dir="rtl" />
        </div>
        <button onClick={() => setShowForm(true)} className="px-3 rounded-xl brand-emerald text-white flex items-center gap-1 text-sm font-semibold shrink-0"><UserPlus className="w-4 h-4" /> جديد</button>
      </div>

      {loading ? <div className="space-y-2.5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-secondary/50 animate-pulse" />)}</div> : (
        <div className="space-y-2.5">
          {users.map((u) => (
            <motion.div key={u.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="legal-card rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl brand-emerald text-white flex items-center justify-center font-bold shrink-0">{getInitials(u.name || u.email)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-bold truncate">{u.name || "—"}</p>
                  {u.isAdmin && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Crown className="w-2.5 h-2.5" /> مسؤول</span>}
                </div>
                <p className="text-[10px] text-muted-foreground truncate" dir="ltr">{u.email}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5"><Briefcase className="w-3 h-3" />{u._count?.cases ?? 0} قضية</span>
                  <span>•</span>
                  <span>{u._count?.clients ?? 0} موكل</span>
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => toggleAdmin(u)} title={u.isAdmin ? "إزالة مسؤول" : "تعيين مسؤول"} className={`p-1.5 rounded-lg ${u.isAdmin ? "bg-amber-100 text-amber-700" : "bg-secondary text-muted-foreground"} hover:opacity-80`}>
                  {u.isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                </button>
                <button onClick={() => remove(u.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-9 h-9 rounded-lg bg-secondary disabled:opacity-40 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
          <span className="text-sm font-semibold">{page} / {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="w-9 h-9 rounded-lg bg-secondary disabled:opacity-40 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
        </div>
      )}

      {showForm && <UserForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function UserForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", isAdmin: false });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) return toast.error("الاسم والبريد مطلوبان");
    if (form.password.length < 6) return toast.error("كلمة المرور 6 أحرف على الأقل");
    setSaving(true);
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast.success("تم إنشاء المستخدم"); onSaved(); }
    else { const e = await res.json().catch(() => ({})); toast.error(e.error || "فشل"); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between"><h3 className="font-bold">مستخدم جديد</h3><button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button></div>
        <div className="p-4 space-y-3">
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الاسم *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" dir="rtl" /></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">البريد *</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" dir="ltr" /></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">كلمة المرور *</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="form-input" dir="ltr" /></label>
          <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الهاتف</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-input" dir="ltr" /></label>
          <label className="flex items-center gap-2 text-sm py-1"><input type="checkbox" checked={form.isAdmin} onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })} className="w-4 h-4 accent-[hsl(158_84%_30%)]" /> منح صلاحية المسؤول</label>
        </div>
        <div className="sticky bottom-0 p-4 border-t bg-card/95 backdrop-blur flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm">إلغاء</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold disabled:opacity-70 flex items-center justify-center gap-1"><Check className="w-4 h-4" /> {saving ? "..." : "إنشاء"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- PLANS ---------- */
const emptyPlan = { name: "", description: "", price: "", durationDays: "30", features: "", limits: "", isActive: true, sortOrder: 0 };
function PlansManager() {
  const [plans, setPlans] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyPlan });
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/admin/subscription-plans").then((r) => r.json()).then((d) => setPlans(Array.isArray(d) ? d : []));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditId(null); setForm({ ...emptyPlan }); setShowForm(true); };
  const openEdit = (p: any) => { setEditId(p.id); setForm({ name: p.name, description: p.description || "", price: String(p.price), durationDays: String(p.durationDays), features: p.features || "", limits: p.limits || "", isActive: p.isActive, sortOrder: p.sortOrder || 0 }); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim()) return toast.error("اسم الخطة مطلوب");
    setSaving(true);
    const payload = { name: form.name, description: form.description, price: Number(form.price) || 0, durationDays: Number(form.durationDays) || 30, features: form.features, limits: form.limits, isActive: form.isActive, sortOrder: Number(form.sortOrder) || 0 };
    const url = editId ? `/api/admin/subscription-plans/${editId}` : "/api/admin/subscription-plans";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { toast.success(editId ? "تم التحديث" : "تمت الإضافة"); setShowForm(false); load(); }
    else toast.error("فشل الحفظ");
  };

  const deactivate = async (id: string) => {
    const res = await fetch(`/api/admin/subscription-plans/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("تم إيقاف الخطة"); load(); }
  };

  return (
    <div>
      <button onClick={openAdd} className="w-full mb-3 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> إضافة خطة</button>
      <div className="space-y-2.5">
        {plans.map((p) => (
          <motion.div key={p.id} layout className="legal-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold truncate">{p.name}</p>
                  {p.isActive ? <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">نشطة</span> : <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">متوقفة</span>}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px]">
                  <span className="font-extrabold text-primary number-magnify">{formatIQD(p.price)}</span>
                  <span className="text-muted-foreground">/ {p.durationDays} يوم</span>
                </div>
                {p.limits && <p className="text-[10px] text-muted-foreground mt-1">{p.limits}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                {p.isActive && <button onClick={() => deactivate(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && setShowForm(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between"><h3 className="font-bold">{editId ? "تعديل خطة" : "خطة جديدة"}</h3><button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button></div>
              <div className="p-4 space-y-3">
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الاسم *</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" dir="rtl" /></label>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الوصف</span><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-input resize-none" dir="rtl" /></label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="block col-span-1"><span className="text-xs text-muted-foreground mb-1 block">السعر</span><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="form-input" dir="ltr" /></label>
                  <label className="block col-span-1"><span className="text-xs text-muted-foreground mb-1 block">المدة (يوم)</span><input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} className="form-input" dir="ltr" /></label>
                  <label className="block col-span-1"><span className="text-xs text-muted-foreground mb-1 block">الترتيب</span><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="form-input" dir="ltr" /></label>
                </div>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">المميزات (مفصولة بفواصل)</span><textarea rows={3} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="form-input resize-none" dir="rtl" /></label>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الحدود</span><input value={form.limits} onChange={(e) => setForm({ ...form, limits: e.target.value })} className="form-input" dir="rtl" placeholder="50 قضية، 100 موكل..." /></label>
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

/* ---------- PAYMENTS ---------- */
function PaymentsManager() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [providerFilter, setProviderFilter] = useState("الكل");

  useEffect(() => {
    fetch("/api/admin/payments").then((r) => r.json()).then((d) => setPayments(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => payments.filter((p) => {
    const ms = statusFilter === "الكل" || p.status === statusFilter;
    const mp = providerFilter === "الكل" || p.provider === providerFilter;
    return ms && mp;
  }), [payments, statusFilter, providerFilter]);

  const statuses = ["الكل", "COMPLETED", "PENDING", "FAILED"];
  const providers = ["الكل", "card", "zaincash", "mock"];
  const statusCfg: Record<string, string> = { COMPLETED: "bg-emerald-100 text-emerald-700", PENDING: "bg-amber-100 text-amber-700", FAILED: "bg-rose-100 text-rose-700" };
  const provIcon: Record<string, string> = { card: "💳", zaincash: "📱", mock: "🧪" };

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-2">
        {statuses.map((s) => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusFilter === s ? "brand-emerald text-white shadow" : "bg-secondary text-muted-foreground"}`}>{s === "COMPLETED" ? "مكتمل" : s === "PENDING" ? "معلق" : s === "FAILED" ? "فاشل" : s}</button>)}
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-3">
        {providers.map((p) => <button key={p} onClick={() => setProviderFilter(p)} className={`px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap ${providerFilter === p ? "bg-secondary-foreground text-background" : "bg-secondary text-muted-foreground"}`}>{p}</button>)}
      </div>
      {loading ? <div className="space-y-2.5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-secondary/50 animate-pulse" />)}</div> : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">لا توجد مدفوعات</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((p) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="legal-card rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shrink-0">{provIcon[p.provider] || "💰"}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{p.user?.name || p.user?.email || "مستخدم"}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
                  {p.plan?.name && <span>{p.plan.name}</span>}
                  <span>•</span>
                  <span>{new Date(p.createdAt).toLocaleDateString("ar-EG")}</span>
                  {p.status && <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${statusCfg[p.status] || "bg-muted"}`}>{p.status}</span>}
                </p>
              </div>
              <p className="text-sm font-extrabold text-emerald-600 number-magnify shrink-0">{formatIQD(p.amount)}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
