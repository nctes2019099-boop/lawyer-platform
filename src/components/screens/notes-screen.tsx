"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Plus, Clock, Pin, Trash2, Save, StickyNote } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "react-hot-toast";

export function NotesScreen() {
  const { navigate, dialogOpen, setDialogOpen } = useAppStore();
  const [notes, setNotes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showQuick, setShowQuick] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => fetch("/api/notes").then((r) => r.json()).then((d) => { setNotes(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (dialogOpen === "add") { setDialogOpen(null); navigate("note-editor"); }
  }, [dialogOpen, setDialogOpen, navigate]);

  const filtered = useMemo(() => {
    const q = search.trim();
    const sorted = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned));
    return q ? sorted.filter((n) => (n.title || "").includes(q) || (n.content || "").includes(q)) : sorted;
  }, [notes, search]);

  const deleteNote = async (id: string) => {
    setDeletingId(id);
    const prev = notes;
    setNotes((p) => p.filter((n) => n.id !== id));
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!res.ok) { setNotes(prev); toast.error("فشل الحذف"); }
    setDeletingId(null);
  };

  const quickSave = async () => {
    if (!title.trim()) return toast.error("العنوان مطلوب");
    setSaving(true);
    const res = await fetch("/api/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content }) });
    setSaving(false);
    if (res.ok) { toast.success("تم الحفظ"); setTitle(""); setContent(""); setShowQuick(false); await load(); }
    else toast.error("فشل الحفظ");
  };

  const itemV = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20"><StickyNote className="w-5 h-5 text-white" /></div>
          <div><h2 className="text-lg font-extrabold">المفكرة</h2><p className="text-[11px] text-muted-foreground">ملاحظاتك القانونية</p></div>
        </div>
        <button onClick={() => navigate("note-editor")} className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/30"><Plus className="w-5 h-5 text-white" /></button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في المفكرة..." className="form-input pr-10" dir="rtl" />
      </div>

      {/* Quick create */}
      <motion.div layout className="legal-card rounded-2xl p-3 mb-4">
        <button onClick={() => setShowQuick((v) => !v)} className="w-full flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">إنشاء سريع</span>
          <span className="text-[10px] text-primary">{showQuick ? "إخفاء" : "عرض"}</span>
        </button>
        <AnimatePresence>
          {showQuick && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-2 pt-3">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الملاحظة" className="form-input" dir="rtl" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="محتوى الملاحظة..." className="form-input resize-none" dir="rtl" />
                <button onClick={quickSave} disabled={saving} className="w-full py-2.5 rounded-xl brand-emerald text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                  <Save className="w-4 h-4" /> {saving ? "جارٍ الحفظ..." : "حفظ سريع"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-secondary/50 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">لا توجد ملاحظات</p></div>
      ) : (
        <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.05 }} className="space-y-2.5">
          {filtered.map((n) => (
            <motion.div key={n.id} variants={itemV} layout animate={deletingId === n.id ? { opacity: 0, x: 100 } : { opacity: 1, x: 0 }} className="legal-card rounded-2xl p-3.5 hover-legal cursor-pointer group" onClick={() => navigate("note-editor", { noteId: n.id })}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {n.pinned && <Pin className="w-3 h-3 text-primary fill-current" />}
                    <p className="text-sm font-bold truncate">{n.title || "بدون عنوان"}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{n.content || "—"}</p>
                  <p className="text-[9px] text-muted-foreground/60 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(n.createdAt).toLocaleDateString("ar-EG")}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
