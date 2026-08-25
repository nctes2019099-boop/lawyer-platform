"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Search, Plus, Clock, Printer, X, FileText, Pencil, Trash2, Copy, Check } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "react-hot-toast";

const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  عريضة: { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30", label: "عريضة" },
  لائحة: { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/30", label: "لائحة" },
  دعوى: { color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/30", label: "دعوى" },
  مذكرة: { color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/30", label: "مذكرة" },
  استئناف: { color: "text-destructive", bg: "bg-rose-100 dark:bg-rose-950/30", label: "استئناف" },
  اعتراض: { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30", label: "اعتراض" },
  طعن: { color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-950/30", label: "طعن" },
  تماس: { color: "text-primary", bg: "bg-primary/10", label: "تماس" },
};

const statusCfg: Record<string, string> = {
  مسودة: "bg-gray-100 text-gray-700",
  "قيد التنفيذ": "bg-amber-100 text-amber-700",
  مكتملة: "bg-emerald-100 text-emerald-700",
  مرفوضة: "bg-rose-100 text-rose-700",
  مقدمة: "bg-blue-100 text-blue-700",
  مقبولة: "bg-emerald-100 text-emerald-700",
};

const petitionTypes = ["عريضة", "لائحة", "دعوى", "مذكرة", "استئناف", "اعتراض", "طعن", "تماس"];
const statuses = ["مسودة", "قيد التنفيذ", "مقدمة", "مقبولة", "مكتملة", "مرفوضة"];
const statusTabs = ["الكل", "مسودة", "قيد التنفيذ", "مكتملة", "مرفوضة"];

const templates = [
  { key: "civil", label: "عريضة دعوى مدنية", title: "عريضة دعوى مدنية", content: "إلى محكمة ______ الموقرة\n\nالموكل: ............\nالخصم: ............\nالموضوع: دعوى مدنية\n\nإن الموكل يلتمس من هيئة المحكمة الموقرة الحكم له بـ:\n1- إلزام المدعى عليه بأن يؤدي للمدعي مبلغاً قدره ............\n2- تحميل المدعى عليه الرسوم والمصاريف وأتعاب المحاماة.\n\nولأجله تقرر تقديمه.\nالمحامي: ............\nالتاريخ: ../../...." },
  { key: "criminal", label: "شكوى جزائية", title: "شكوى جزائية", content: "إلى السيد قاضي محكمة جنح ______ الموقر\n\nالمشتكي: ............\nالمشتكى عليه: ............\nالوقائع: بتاريخ ../../.... أقدم المشتكى عليه على ............ مما يشكل جريمة ............\n\nنلتمس اتخاذ الإجراءات القانونية بحق المشتكى عليه وإحالته إلى القضاء.\nالمحامي: ............\nالتاريخ: ../../...." },
  { key: "appeal", label: "لائحة استئنافية", title: "لائحة استئنافية", content: "إلى محكمة استئناف ______ الموقرة\n\nالمستأنف: ............\nالمستأنف عليه: ............\nالحكم المستأنف: رقم ............ تاريخ ../../....\n\nالأسباب:\n1- ............\n2- ............\n\nنلتمس قبول الاستئناف شكلاً ونقض الحكم المميز أو تعديله.\nالمحامي: ............\nالتاريخ: ../../...." },
  { key: "personal", label: "دعوى أحوال شخصية", title: "دعوى أحوال شخصية", content: "إلى محكمة الأحوال الشخصية في ______ الموقرة\n\nالمدعي: ............\nالمدعى عليه: ............\nالموضوع: دعوى ............\n\nالوقائع: ............\nالمطالب: ............\n\nنلتمس الحكم وفق ما ورد أعلاه.\nالمحامي: ............\nالتاريخ: ../../...." },
  { key: "contract", label: "مذكرة دفاع", title: "مذكرة دفاع", content: "مذكرة دفاع\n\nمقدمة من المدعى عليه ............ بوكالة المحامي ............\nبمواجهة المدعي ............\n\nالوقائع: ............\nالدفوع:\nأولاً: ............\nثانياً: ............\nنلتمس رد الدعوى وتحميل المدعي الرسوم والمصاريف.\nالمحامي: ............\nالتاريخ: ../../...." },
  { key: "labor", label: "دعوى عمالية", title: "دعوى عمالية", content: "إلى محكمة العمل في ______ الموقرة\n\nالعامل: ............\nصاحب العمل: ............\nالموضوع: مطالبة بحقوق عمالية\n\nنلتمس الحكم بـ: الأجور المتأخرة / مكافأة نهاية الخدمة / التعويضات المستحقة.\nالمحامي: ............\nالتاريخ: ../../...." },
];

const emptyForm = { title: "", type: "عريضة", content: "", status: "قيد التنفيذ", caseId: "" };

export function PetitionsScreen() {
  const { dialogOpen, setDialogOpen, navigate } = useAppStore();
  const [petitions, setPetitions] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("الكل");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [copied, setCopied] = useState<string | null>(null);

  const load = () => fetch("/api/petitions").then((r) => r.json()).then((d) => { setPetitions(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); fetch("/api/cases").then((r) => r.json()).then((d) => setCases(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  useEffect(() => {
    if (dialogOpen === "add") { setDialogOpen(null); openAdd(); }
  }, [dialogOpen, setDialogOpen]);

  const openAdd = () => { setEditId(null); setForm({ ...emptyForm }); setShowForm(true); setShowTemplates(true); };
  const openEdit = (p: any) => { setEditId(p.id); setForm({ title: p.title, type: p.type || "عريضة", content: p.content || "", status: p.status || "قيد التنفيذ", caseId: p.caseId || "" }); setShowForm(true); setShowTemplates(false); };

  const filtered = useMemo(() => {
    const q = search.trim();
    return petitions.filter((p) => {
      const matchSearch = !q || (p.title || "").includes(q) || (p.content || "").includes(q);
      const matchStatus = activeStatus === "الكل" || (p.status || "قيد التنفيذ") === activeStatus;
      return matchSearch && matchStatus;
    });
  }, [petitions, search, activeStatus]);

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    if (!form.content.trim()) return toast.error("نص العريضة مطلوب");
    setSaving(true);
    const payload: any = { ...form }; if (!payload.caseId) delete payload.caseId;
    const url = editId ? `/api/petitions/${editId}` : "/api/petitions";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { toast.success(editId ? "تم التحديث" : "تم الحفظ"); setShowForm(false); await load(); }
    else toast.error("تعذّر الحفظ");
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    const prev = petitions;
    setPetitions((p) => p.filter((x) => x.id !== id));
    const res = await fetch(`/api/petitions/${id}`, { method: "DELETE" });
    if (!res.ok) { setPetitions(prev); toast.error("فشل الحذف"); }
    setDeletingId(null);
  };

  const copy = (p: any) => {
    navigator.clipboard.writeText(`${p.title}\n\n${p.content}`);
    setCopied(p.id); toast.success("تم نسخ العريضة");
    setTimeout(() => setCopied(null), 1500);
  };

  const print = (p: any) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html dir="rtl"><head><meta charset="utf-8"><title>${p.title}</title><style>body{font-family:serif;padding:40px;line-height:2;white-space:pre-wrap}</style></head><body><h2>${p.title}</h2>${p.content}</body></html>`);
    w.document.close(); w.print();
  };

  const itemV = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20"><ScrollText className="w-5 h-5 text-white" /></div>
          <div><h2 className="text-lg font-extrabold">العرائض</h2><p className="text-[11px] text-muted-foreground">صياغة وإدارة العرائض</p></div>
        </div>
        <button onClick={openAdd} className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/30"><Plus className="w-5 h-5 text-white" /></button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في العرائض..." className="form-input pr-10" dir="rtl" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 mb-4">
        {statusTabs.map((s) => (
          <button key={s} onClick={() => setActiveStatus(s)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${activeStatus === s ? "brand-emerald text-white shadow" : "bg-secondary text-muted-foreground"}`}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-secondary/50 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><ScrollText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">لا توجد عرائض</p></div>
      ) : (
        <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.05 }} className="space-y-3">
          {filtered.map((p) => {
            const t = typeConfig[p.type] || typeConfig["عريضة"];
            return (
              <motion.div key={p.id} variants={itemV} layout animate={deletingId === p.id ? { opacity: 0, height: 0 } : { opacity: 1, height: "auto" }} className="legal-card rounded-2xl p-4 hover-legal">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => p.caseId && navigate("case-details", { caseId: p.caseId })}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${t.bg} ${t.color}`}>{t.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${statusCfg[p.status] || statusCfg["قيد التنفيذ"]}`}>{p.status || "قيد التنفيذ"}</span>
                    </div>
                    <p className="text-sm font-bold">{p.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.content?.substring(0, 120)}...</p>
                    <p className="text-[9px] text-muted-foreground/60 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(p.createdAt).toLocaleDateString("ar-EG")}{p.case ? ` • ${p.case.caseNumber}` : ""}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => copy(p)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary">{copied === p.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}</button>
                    <button onClick={() => print(p)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Printer className="w-3.5 h-3.5" /></button>
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !saving && setShowForm(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />{editId ? "تعديل عريضة" : "عريضة جديدة"}</h3>
                <button onClick={() => !saving && setShowForm(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <button onClick={() => setShowTemplates((v) => !v)} className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm font-semibold">
                    <span>القوالب الجاهزة ({templates.length})</span><span className="text-xs">{showTemplates ? "إخفاء" : "عرض"}</span>
                  </button>
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {templates.map((tpl) => <button key={tpl.key} onClick={() => { setForm((f) => ({ ...f, title: tpl.title, content: tpl.content })); setShowTemplates(false); toast.success("تم تحميل القالب"); }} className="text-right p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/40"><ScrollText className="w-4 h-4 text-primary mb-1" /><p className="text-[11px] font-medium leading-tight">{tpl.label}</p></button>)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">العنوان *</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="form-input" dir="rtl" /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block"><span className="text-xs text-muted-foreground mb-1 block">النوع</span><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="form-input" dir="rtl">{petitionTypes.map((t) => <option key={t}>{t}</option>)}</select></label>
                  <label className="block"><span className="text-xs text-muted-foreground mb-1 block">الحالة</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-input" dir="rtl">{statuses.map((t) => <option key={t}>{t}</option>)}</select></label>
                </div>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">مرتبطة بقضية</span><select value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })} className="form-input" dir="rtl"><option value="">— بدون —</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
                <label className="block"><span className="text-xs text-muted-foreground mb-1 block">النص *</span><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} className="form-input resize-none font-mono text-[13px] leading-loose" dir="rtl" /></label>
              </div>
              <div className="sticky bottom-0 bg-card/95 backdrop-blur p-4 border-t flex gap-2">
                <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm font-medium">إلغاء</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold disabled:opacity-70">{saving ? "جارٍ..." : "حفظ"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
