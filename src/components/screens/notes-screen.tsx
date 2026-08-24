"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Plus, Clock, Pin, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "react-hot-toast";

export function NotesScreen() {
  const { navigate, dialogOpen, setDialogOpen } = useAppStore();
  const [notes, setNotes] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then((data) => { setNotes(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (dialogOpen === "add") { setDialogOpen(null); navigate("note-editor"); }
  }, [dialogOpen, setDialogOpen, navigate]);

  const filtered = notes.filter((n: any) => !search || (n.title || "").includes(search) || (n.content || "").includes(search));

  const deleteNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes(prev => prev.filter((n: any) => n.id !== id));
    toast.success("تم الحذف");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen p-4 pb-24 fingerprint-bg">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-lg mx-auto space-y-4">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">المفكرة القانونية</p>
            <h2 className="text-lg font-bold text-foreground">المفكرة</h2>
          </div>
          <motion.button onClick={() => navigate("note-editor")} className="w-10 h-10 rounded-xl seal-gold flex items-center justify-center shadow-md" whileTap={{ scale: 0.9 }}>
            <Plus className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>

        <motion.div variants={itemVariants} className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="البحث في المفكرة..." className="w-full h-11 pr-10 pl-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none" dir="rtl" />
        </motion.div>

        <motion.div variants={containerVariants} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <motion.div key={i} variants={itemVariants} className="legal-card rounded-2xl p-4 h-24 animate-pulse" />)
            ) : filtered.length === 0 ? (
              <motion.div variants={itemVariants} className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">لا توجد مذكرات</p>
              </motion.div>
            ) : (
              filtered.map((n: any) => (
                <motion.div key={n.id} variants={itemVariants} layout className="legal-card rounded-2xl p-4 hover-legal cursor-pointer group" onClick={() => navigate("note-editor", { noteId: n.id })}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground truncate">{n.title || "بدون عنوان"}</p>
                        {n.pinned && <Pin className="w-3 h-3 text-primary" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{n.content || "—"}</p>
                      <p className="text-[9px] text-muted-foreground/60 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.createdAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
