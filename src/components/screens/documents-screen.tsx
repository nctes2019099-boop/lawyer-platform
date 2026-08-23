"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Plus, Download, Eye, File, Image as ImageIcon } from "lucide-react";
import { useAppStore } from "@/lib/store";

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  PDF: { icon: FileText, color: "text-destructive" },
  DOC: { icon: File, color: "text-accent" },
  IMG: { icon: ImageIcon, color: "text-emerald-600" },
  OTHER: { icon: File, color: "text-muted-foreground" },
};

export function DocumentsScreen() {
  const { setDialogOpen } = useAppStore();
  const [documents, setDocuments] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => { setDocuments(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = documents.filter((d: any) => !search || (d.name || "").includes(search));

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
            <p className="text-xs text-muted-foreground">إدارة المستندات</p>
            <h2 className="text-lg font-bold text-foreground">المستندات</h2>
          </div>
          <motion.button onClick={() => setDialogOpen("add")} className="w-10 h-10 rounded-xl seal-gold flex items-center justify-center shadow-md" whileTap={{ scale: 0.9 }}>
            <Plus className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>

        <motion.div variants={itemVariants} className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="البحث في المستندات..." className="w-full h-11 pr-10 pl-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none" dir="rtl" />
        </motion.div>

        <motion.div variants={containerVariants} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <motion.div key={i} variants={itemVariants} className="legal-card rounded-2xl p-4 h-20 animate-pulse" />)
            ) : filtered.length === 0 ? (
              <motion.div variants={itemVariants} className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">لا توجد مستندات</p>
              </motion.div>
            ) : (
              filtered.map((d: any) => {
                const ext = (d.name || "").split(".").pop()?.toUpperCase() || "OTHER";
                const t = typeConfig[ext] || typeConfig["OTHER"];
                const TypeIcon = t.icon;
                return (
                  <motion.div key={d.id} variants={itemVariants} layout className="legal-card rounded-2xl p-4 hover-legal">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon className={`w-5 h-5 ${t.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                        <p className="text-[10px] text-muted-foreground">{d.size || "—"} • {new Date(d.createdAt).toLocaleDateString("ar-EG")}</p>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-2 rounded-lg hover:bg-secondary transition-colors"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                        <button className="p-2 rounded-lg hover:bg-secondary transition-colors"><Download className="w-4 h-4 text-muted-foreground" /></button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
