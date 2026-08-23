"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Search, Plus, Clock, FileText, Printer } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "react-hot-toast";

const typeConfig: Record<string, { color: string; label: string }> = {
  عريضة: { color: "text-amber-600", label: "عريضة" },
  لائحة: { color: "text-accent", label: "لائحة" },
  مذكرة: { color: "text-emerald-600", label: "مذكرة" },
  استئناف: { color: "text-destructive", label: "استئناف" },
  تماس: { color: "text-primary", label: "تماس" },
};

export function PetitionsScreen() {
  const { setDialogOpen } = useAppStore();
  const [petitions, setPetitions] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/petitions")
      .then((r) => r.json())
      .then((data) => { setPetitions(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = petitions.filter((p: any) => !search || (p.title || "").includes(search));

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
            <p className="text-xs text-muted-foreground">العرائض القانونية</p>
            <h2 className="text-lg font-bold text-foreground">العرائض</h2>
          </div>
          <motion.button onClick={() => setDialogOpen("add")} className="w-10 h-10 rounded-xl seal-gold flex items-center justify-center shadow-md" whileTap={{ scale: 0.9 }}>
            <Plus className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>

        <motion.div variants={itemVariants} className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="البحث في العرائض..." className="w-full h-11 pr-10 pl-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none" dir="rtl" />
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
                      <button onClick={() => toast("طباعة")} className="p-2 rounded-xl hover:bg-secondary transition-colors">
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
    </div>
  );
}
