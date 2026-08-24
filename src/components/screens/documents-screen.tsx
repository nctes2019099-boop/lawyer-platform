"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, Plus, Download, Trash2, X, File, FileCheck2,
  FileSpreadsheet, FileImage, Briefcase, Grid3x3, List,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "react-hot-toast";

const types = ["وثيقة", "عقد", "حكم", "توكيل", "إفادة", "تقرير", "مراسلات", "أخرى"];
const typeIcons: Record<string, string> = {
  "عقد": "📄", "حكم": "⚖️", "توكيل": "✍️", "إفادة": "📋",
  "تقرير": "📊", "مراسلات": "✉️", "وثيقة": "📑", "أخرى": "🗂️",
};

const emptyForm = { title: "", type: "وثيقة", fileUrl: "", caseId: "" };

export function DocumentsScreen() {
  const { navigate, dialogOpen, setDialogOpen } = useAppStore();
  const [docs, setDocs] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("الكل");
  const [view, setView] = useState<"grid" | "list">("list");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/documents").then((r) => r.json()).then((d) => { setDocs(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => {
    load();
    fetch("/api/cases").then((r) => r.json()).then((d) => setCases(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  useEffect(() => { if (dialogOpen === "add") { setDialogOpen(null); setShowForm(true); } }, [dialogOpen, setDialogOpen]);

  const filtered = useMemo(() => {
    const q = search.trim();
    return docs.filter((d) => {
      const matchType = typeFilter === "الكل" || d.type === typeFilter;
      const matchQ = !q || (d.title || "").includes(q) || (d.type || "").includes(q);
      return matchType && matchQ;
    });
  }, [docs, search, typeFilter]);

  const save = async () => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    setSaving(true);
    const payload: any = { title: form.title, type: form.type };
    if (form.fileUrl.trim()) payload.fileUrl = form.fileUrl.trim();
    if (form.caseId) payload.caseId = form.caseId;
    const res = await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { toast.success("تمت الإضافة"); setShowForm(false); setForm({ ...emptyForm }); load(); }
    else toast.error("فشل الحفظ");
  };

  const remove = async (id: string) => {
    const prev = docs; setDocs((p) => p.filter((x) => x.id !== id));
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) { setDocs(prev); toast.error("فشل الحذف"); }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20"><FileText className="w-5 h-5 text-white" /></div>
          <div><h2 className="text-lg font-extrabold">المستندات</h2><p className="text-[11px] text-muted-foreground">{docs.length} مستنداً</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-xl p-0.5">
            <button onClick={() => setView("list")} className={`w-8 h-8 rounded-lg flex items-center justify-center ${view === "list" ? "bg-card shadow" : ""}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setView("grid")} className={`w-8 h-8 rounded-lg flex items-center justify-center ${view === "grid" ? "bg-card shadow" : ""}`}><Grid3x3 className="w-4 h-4" /></button>
          </div>
          <button onClick={() => setShowForm(true)} className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/30"><Plus className="w-5 h-5 text-white" /></button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في المستندات..." className="form-input pr-10" dir="rtl" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-3">
        {["الكل", ...types].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${typeFilter === t ? "brand-emerald text-white shadow" : "bg-secondary text-muted-foreground"}`}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2.5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-secondary/50 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">لا توجد مستندات</p></div>
      ) : view === "list" ? (
        <div className="space-y-2.5">
          {filtered.map((d) => (
            <motion.div key={d.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="legal-card rounded-2xl p-3.5 flex items-center gap-3 group">
              <span className="text-2xl">{typeIcons[d.type] || "📄"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{d.title}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="bg-secondary px-1.5 py-0.5 rounded">{d.type}</span>
                  {d.case && <button onClick={() => navigate("case-details", { caseId: d.caseId })} className="flex items-center gap-0.5 text-primary hover:underline"><Briefcase className="w-3 h-3" />{d.case.caseNumber}</button>}
                  <span>{new Date(d.createdAt).toLocaleDateString("ar-EG")}</span>
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                {d.fileUrl && (
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-secondary text-primary"><Download className="w-4 h-4" /></a>
                )}
                <button onClick={() => remove(d.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((d) => (
            <motion.div key={d.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="legal-card rounded-2xl p-4 text-center group">
              <span className="text-4xl block mb-2">{typeIcons[d.type] || "📄"}</span>
              <p className="text-sm font-bold truncate">{d.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{d.type}</p>
              <div className="flex items-center justify-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-secondary text-primary"><Download className="w-3.5 h-3.5" /></a>}
                <button onClick={() => remove(d.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && setShowForm(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between">
                <h3 className="font-bold">مستند جديد</h3>
                <button onClick={() => !saving && setShowForm(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-3">
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">عنوان المستند *</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="form-input" dir="rtl" /></label>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">النوع</span>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="form-input" dir="rtl">{types.map((t) => <option key={t}>{t}</option>)}</select>
                </label>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">رابط الملف</span><input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." className="form-input" dir="ltr" /></label>
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
