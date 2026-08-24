"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  Users, Search, Plus, Phone, Mail, Download, LayoutGrid, List,
  Star, Crown, Briefcase, X, UserPlus,
} from "lucide-react";
import { getInitials, getRelativeTime } from "@/lib/utils";
import { toast } from "react-hot-toast";

const categories = ["الكل", "عامة", "خاصة", "VIP", "تجاري", "عقاري", "عمالي", "جنائي", "مدني", "أحوال شخصية"];

const catConfig: Record<string, { border: string; bg: string; text: string; icon?: React.ElementType }> = {
  عامة: { border: "border-gray-200 dark:border-gray-700", bg: "bg-gray-50 dark:bg-gray-900/40", text: "text-gray-700 dark:text-gray-300" },
  خاصة: { border: "border-blue-200 dark:border-blue-900", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-300", icon: Star },
  VIP: { border: "border-amber-200 dark:border-amber-900", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-300", icon: Crown },
  تجاري: { border: "border-emerald-200 dark:border-emerald-900", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", icon: Briefcase },
  عقاري: { border: "border-purple-200", bg: "bg-purple-50", text: "text-purple-700" },
  عمالي: { border: "border-orange-200", bg: "bg-orange-50", text: "text-orange-700" },
  جنائي: { border: "border-red-200", bg: "bg-red-50", text: "text-red-700" },
  مدني: { border: "border-cyan-200", bg: "bg-cyan-50", text: "text-cyan-700" },
  "أحوال شخصية": { border: "border-pink-200", bg: "bg-pink-50", text: "text-pink-700" },
};

const emptyForm = { name: "", email: "", phone: "", address: "", governorate: "", category: "عامة", notes: "" };

export function ClientsScreen() {
  const { navigate, dialogOpen, setDialogOpen } = useAppStore();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("الكل");
  const [viewMode, setViewMode] = useState<"list" | "grid">(
    () => (typeof window !== "undefined" && (localStorage.getItem("clients-view") as "list" | "grid")) || "list"
  );
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const load = () => fetch("/api/clients").then((r) => r.json()).then((d) => { setClients(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (dialogOpen === "add") { setShowAdd(true); setDialogOpen(null); setForm({ ...emptyForm }); }
  }, [dialogOpen, setDialogOpen]);

  useEffect(() => { localStorage.setItem("clients-view", viewMode); }, [viewMode]);

  const stats = useMemo(() => {
    const total = clients.length;
    const now = new Date();
    const newThisMonth = clients.filter((c) => { const d = new Date(c.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
    const vip = clients.filter((c) => c.category === "VIP").length;
    return { total, newThisMonth, vip };
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.trim();
    return clients.filter((c) => {
      const matchCat = activeCat === "الكل" || c.category === activeCat;
      const matchSearch = !q || (c.name || "").includes(q) || (c.phone || "").includes(q);
      return matchCat && matchSearch;
    });
  }, [clients, search, activeCat]);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("اسم الموكل مطلوب");
    setSaving(true);
    try {
      const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast.success("تمت إضافة الموكل"); setShowAdd(false); setForm({ ...emptyForm }); await load();
    } catch { toast.error("فشل الحفظ"); } finally { setSaving(false); }
  };

  const containerV = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const itemV = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div><h2 className="text-lg font-extrabold">الموكلين</h2><p className="text-[11px] text-muted-foreground">قاعدة بيانات الموكلين</p></div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => window.open("/api/export?type=clients", "_blank")} className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center" title="تصدير"><Download className="w-4 h-4" /></button>
          <div className="flex bg-secondary/60 rounded-xl p-0.5">
            <button onClick={() => setViewMode("list")} className={`w-9 h-9 rounded-lg flex items-center justify-center ${viewMode === "list" ? "bg-card shadow text-primary" : "text-muted-foreground"}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("grid")} className={`w-9 h-9 rounded-lg flex items-center justify-center ${viewMode === "grid" ? "bg-card shadow text-primary" : "text-muted-foreground"}`}><LayoutGrid className="w-4 h-4" /></button>
          </div>
          <button onClick={() => { setShowAdd(true); setForm({ ...emptyForm }); }} className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/30"><Plus className="w-5 h-5 text-white" /></button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." className="form-input pr-10" dir="rtl" />
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-3">
        <MiniStat value={stats.total} label="الإجمالي" />
        <MiniStat value={stats.newThisMonth} label="جديد الشهر" accent="text-emerald-600" />
        <MiniStat value={stats.vip} label="VIP" accent="text-amber-600" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-4">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCat(cat)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${activeCat === cat ? "brand-emerald text-white shadow" : "bg-secondary text-muted-foreground"}`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-secondary/50 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">لا يوجد موكلون</p></div>
      ) : viewMode === "list" ? (
        <motion.div variants={containerV} initial="hidden" animate="show" className="space-y-2.5">
          {filtered.map((c) => {
            const cfg = catConfig[c.category] || catConfig["عامة"];
            const Icon = cfg.icon;
            const caseCount = c.cases?.length || 0;
            return (
              <motion.button key={c.id} variants={itemV} onClick={() => navigate("client-profile", { clientId: c.id })}
                className={`w-full text-right legal-card rounded-2xl p-3.5 hover-legal border ${cfg.border}`}>
                <div className="flex items-center gap-3">
                  <div className={`relative w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center font-bold ${cfg.text} shrink-0`}>
                    {getInitials(c.name || "؟")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{c.name}</p>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${cfg.bg} ${cfg.text} flex items-center gap-0.5`}>
                        {Icon && <Icon className="w-2.5 h-2.5" />} {c.category}
                      </span>
                    </div>
                    {c.phone && <p className="text-[11px] text-muted-foreground mt-0.5" dir="ltr">{c.phone}</p>}
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {caseCount > 0 ? `📋 ${caseCount} قضايا • ` : ""}{getRelativeTime(c.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {c.phone && <a href={`tel:${c.phone}`} className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center"><Phone className="w-3.5 h-3.5" /></a>}
                    {c.email && <a href={`mailto:${c.email}`} className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center"><Mail className="w-3.5 h-3.5" /></a>}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      ) : (
        <motion.div variants={containerV} initial="hidden" animate="show" className="grid grid-cols-3 gap-2.5">
          {filtered.map((c) => {
            const cfg = catConfig[c.category] || catConfig["عامة"];
            const caseCount = c.cases?.length || 0;
            return (
              <motion.button key={c.id} variants={itemV} onClick={() => navigate("client-profile", { clientId: c.id })}
                className={`legal-card rounded-2xl p-3 flex flex-col items-center text-center hover-legal border ${cfg.border}`}>
                <div className={`w-12 h-12 rounded-full ${cfg.bg} flex items-center justify-center font-bold ${cfg.text} mb-2`}>{getInitials(c.name || "؟")}</div>
                <p className="text-xs font-bold truncate w-full">{c.name}</p>
                <span className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${cfg.bg} ${cfg.text}`}>{c.category}</span>
                <p className="text-[10px] text-muted-foreground mt-1">{caseCount} قضية</p>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && setShowAdd(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><UserPlus className="w-4 h-4 text-primary" /> موكل جديد</h3>
                <button onClick={() => !saving && setShowAdd(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-3">
                <Field label="الاسم *"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" dir="rtl" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="الهاتف"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-input" dir="ltr" /></Field>
                  <Field label="البريد"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" dir="ltr" /></Field>
                </div>
                <Field label="التصنيف"><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="form-input" dir="rtl">{categories.filter((c) => c !== "الكل").map((c) => <option key={c}>{c}</option>)}</select></Field>
                <Field label="المحافظة"><input value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })} className="form-input" dir="rtl" /></Field>
                <Field label="العنوان"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-input" dir="rtl" /></Field>
                <Field label="ملاحظات"><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="form-input resize-none" dir="rtl" /></Field>
              </div>
              <div className="sticky bottom-0 bg-card/95 backdrop-blur p-4 border-t flex gap-2">
                <button onClick={() => setShowAdd(false)} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm font-medium">إلغاء</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold disabled:opacity-70">{saving ? "جارٍ..." : "حفظ الموكل"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniStat({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <div className="legal-card rounded-xl p-3 text-center">
      <p className={`text-2xl font-extrabold number-magnify ${accent || "text-foreground"}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>{children}</label>;
}
