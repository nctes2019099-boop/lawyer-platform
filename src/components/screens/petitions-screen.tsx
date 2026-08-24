"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Search, Plus, Clock, Printer, X, FileText } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "react-hot-toast";

const typeConfig: Record<string, { color: string; label: string }> = {
  عريضة: { color: "text-amber-600", label: "عريضة" },
  لائحة: { color: "text-accent", label: "لائحة" },
  مذكرة: { color: "text-emerald-600", label: "مذكرة" },
  استئناف: { color: "text-destructive", label: "استئناف" },
  تماس: { color: "text-primary", label: "تماس" },
};

const petitionTypes = ["عريضة", "لائحة", "مذكرة", "استئناف", "تماس"];

const templates = [
  {
    key: "civil",
    label: "عريضة دعوى مدنية",
    title: "عريضة دعوى مدنية",
    content:
      "إلى محكمة ______ الموقرة\n\nالموكل: ............\nالخصم: ............\nالموضوع: دعوى مدنية\n\nإن الموكل يلتمس من هيئة المحكمة الموقرة الحكم له بـ:\n1- إلزام المدعى عليه بأن يؤدي للمدعي مبلغاً قدره ............\n2- تحميل المدعى عليه الرسوم والمصاريف وأتعاب المحاماة.\n\nولأجله تقرر تقديمه.\nالمحامي: ............\nالتاريخ: ../../....",
  },
  {
    key: "criminal",
    label: "شكوى جزائية",
    title: "شكوى جزائية",
    content:
      "إلى السيد قاضي محكمة جنح ______ الموقر\n\nالمشتكي: ............\nالمشتكى عليه: ............\nالوقائع: بتاريخ ../../.... أقدم المشتكى عليه على ............ مما يشكل جريمة ............\n\nنلتمس اتخاذ الإجراءات القانونية بحق المشتكى عليه وإحالته إلى القضاء.\nالمحامي: ............\nالتاريخ: ../../....",
  },
  {
    key: "appeal",
    label: "لائحة استئنافية",
    title: "لائحة استئنافية",
    content:
      "إلى محكمة استئناف ______ الموقرة\n\nالمستأنف: ............\nالمستأنف عليه: ............\nالحكم المستأنف: رقم ............ تاريخ ../../....\n\nالأسباب:\n1- ............\n2- ............\n\nنلتمس قبول الاستئناف شكلاً ونقض الحكم المميز أو تعديله.\nالمحامي: ............\nالتاريخ: ../../....",
  },
  {
    key: "personal",
    label: "دعوى أحوال شخصية",
    title: "دعوى أحوال شخصية",
    content:
      "إلى محكمة الأحوال الشخصية في ______ الموقرة\n\nالمدعي: ............\nالمدعى عليه: ............\nالموضوع: دعوى ............\n\nالوقائع: ............\nالمطالب: ............\n\nنلتمس الحكم وفق ما ورد أعلاه.\nالمحامي: ............\nالتاريخ: ../../....",
  },
  {
    key: "contract",
    label: "مذكرة دفاع تعاقدية",
    title: "مذكرة دفاع",
    content:
      "مذكرة دفاع\n\nمقدمة من المدعى عليه ............ بوكالة المحامي ............\nبمواجهة المدعي ............\n\nالوقائع: ............\nالدفوع:\nأولاً: ............\nثانياً: ............\nنلتمس رد الدعوى وتحميل المدعي الرسوم والمصاريف.\nالمحامي: ............\nالتاريخ: ../../....",
  },
  {
    key: "labor",
    label: "دعوى عمالية",
    title: "دعوى عمالية",
    content:
      "إلى محكمة العمل في ______ الموقرة\n\nالعامل: ............\nصاحب العمل: ............\nالموضوع: مطالبة بحقوق عمالية\n\nنلتمس الحكم بـ: الأجور المتأخرة / مكافأة نهاية الخدمة / التعويضات المستحقة.\nالمحامي: ............\nالتاريخ: ../../....",
  },
];

export function PetitionsScreen() {
  const { dialogOpen, setDialogOpen } = useAppStore();
  const [petitions, setPetitions] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", type: "عريضة", content: "", status: "قيد التنفيذ" });

  const load = () =>
    fetch("/api/petitions")
      .then((r) => r.json())
      .then((data) => { setPetitions(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (dialogOpen === "add") { setShowAdd(true); setDialogOpen(null); setShowTemplates(true); }
  }, [dialogOpen, setDialogOpen]);

  const filtered = petitions.filter((p: any) => !search || (p.title || "").includes(search));

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("العنوان مطلوب");
    if (!form.content.trim()) return toast.error("نص العريضة مطلوب");
    setSaving(true);
    try {
      const res = await fetch("/api/petitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("تم حفظ العريضة");
      setShowAdd(false);
      setShowTemplates(false);
      setForm({ title: "", type: "عريضة", content: "", status: "قيد التنفيذ" });
      await load();
    } catch {
      toast.error("تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (tpl: typeof templates[number]) => {
    setForm((f) => ({ ...f, title: tpl.title, content: tpl.content }));
    setShowTemplates(false);
    toast.success("تم تحميل القالب — عدّل النص حسب الحاجة");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen p-4 pb-24 fingerprint-bg">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-lg mx-auto space-y-4">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">العرائض القانونية</p>
            <h2 className="text-lg font-bold text-foreground">العرائض</h2>
          </div>
          <motion.button
            onClick={() => { setShowAdd(true); setShowTemplates(true); setForm({ title: "", type: "عريضة", content: "", status: "قيد التنفيذ" }); }}
            className="w-10 h-10 rounded-xl seal-gold flex items-center justify-center shadow-md"
            whileTap={{ scale: 0.9 }}>
            <Plus className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>

        <motion.div variants={itemVariants} className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث في العرائض..."
            className="w-full h-11 pr-10 pl-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none"
            dir="rtl" />
        </motion.div>

        <motion.div variants={containerVariants} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <motion.div key={i} variants={itemVariants} className="legal-card rounded-2xl p-4 h-24 animate-pulse" />)
            ) : filtered.length === 0 ? (
              <motion.div variants={itemVariants} className="text-center py-12">
                <ScrollText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">لا توجد عرائض</p>
              </motion.div>
            ) : (
              filtered.map((p: any) => {
                const t = typeConfig[p.type] || typeConfig["عريضة"];
                return (
                  <motion.div key={p.id} variants={itemVariants} layout className="legal-card rounded-2xl p-4 hover-legal">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md bg-secondary/50 ${t.color} font-medium`}>{t.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md ${p.status === "مكتملة" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{p.status || "قيد التنفيذ"}</span>
                        </div>
                        <p className="text-sm font-bold text-foreground">{p.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.content?.substring(0, 100)}...</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(p.createdAt).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                      <button onClick={() => toast("الطباعة ستتاح عند التصدير")} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                        <Printer className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Add Petition Dialog */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center"
            onClick={() => !saving && setShowAdd(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 bg-card/95 backdrop-blur p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> عريضة جديدة</h3>
                <button onClick={() => !saving && setShowAdd(false)} className="w-8 h-8 rounded-xl hover:bg-secondary flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {/* Templates */}
                <div>
                  <button onClick={() => setShowTemplates((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm font-medium">
                    <span>القوالب الجاهزة ({templates.length})</span>
                    <span className="text-xs">{showTemplates ? "إخفاء" : "عرض"}</span>
                  </button>
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden">
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {templates.map((tpl) => (
                            <button key={tpl.key} onClick={() => applyTemplate(tpl)}
                              className="text-right p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors border border-border/40">
                              <ScrollText className="w-4 h-4 text-primary mb-1" />
                              <p className="text-[11px] font-medium leading-tight">{tpl.label}</p>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground mb-1 block">العنوان *</span>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="form-input" dir="rtl" placeholder="عنوان العريضة" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground mb-1 block">النوع</span>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="form-input" dir="rtl">
                      {petitionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-muted-foreground mb-1 block">الحالة</span>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-input" dir="rtl">
                      <option value="قيد التنفيذ">قيد التنفيذ</option>
                      <option value="مكتملة">مكتملة</option>
                      <option value="مسودة">مسودة</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground mb-1 block">النص *</span>
                  <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={10} className="form-input resize-none font-mono text-[13px] leading-loose" dir="rtl" />
                </label>
              </div>

              <div className="sticky bottom-0 bg-card/95 backdrop-blur p-4 border-t border-border flex gap-2">
                <button onClick={() => setShowAdd(false)} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-all text-sm font-medium">إلغاء</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl seal-gold text-white hover:opacity-90 transition-all text-sm font-medium disabled:opacity-70">
                  {saving ? "جارٍ الحفظ..." : "حفظ العريضة"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
