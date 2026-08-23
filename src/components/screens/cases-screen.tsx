"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  Briefcase, Search, Plus, ChevronLeft, Filter, Clock,
  Gavel, AlertTriangle, CheckCircle2, XCircle, PauseCircle
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  "قيد النظر": { label: "قيد النظر", color: "text-amber-600", icon: Clock },
  "جاري التنفيذ": { label: "جاري التنفيذ", color: "text-emerald-600", icon: Gavel },
  مكتملة: { label: "مكتملة", color: "text-emerald-700", icon: CheckCircle2 },
  مؤجلة: { label: "مؤجلة", color: "text-primary", icon: PauseCircle },
  مرفوضة: { label: "مرفوضة", color: "text-destructive", icon: XCircle },
};

const priorityConfig: Record<string, { color: string; barColor: string; label: string }> = {
  عادية: { color: "bg-emerald-500", barColor: "bg-emerald-500", label: "عادية" },
  مهمة: { color: "bg-amber-500", barColor: "bg-amber-500", label: "مهمة" },
  عاجلة: { color: "bg-rose-500", barColor: "bg-rose-500", label: "عاجلة" },
  حرجة: { color: "bg-destructive", barColor: "bg-destructive", label: "حرجة" },
};

const tabs = ["الكل", "قيد النظر", "جاري التنفيذ", "مكتملة", "مؤجلة", "مرفوضة"];

export function CasesScreen() {
  const { navigate, setDialogOpen } = useAppStore();
  const [cases, setCases] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("الكل");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then((data) => { setCases(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = cases.filter((c: any) => {
    const matchesSearch = !search || (c.title || "").toLowerCase().includes(search.toLowerCase()) || (c.caseNumber || "").includes(search);
    const matchesTab = activeTab === "الكل" || c.status === activeTab;
    return matchesSearch && matchesTab;
  });

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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-lg mx-auto space-y-4"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">إدارة القضايا</p>
            <h2 className="text-lg font-bold text-foreground">القضايا</h2>
          </div>
          <motion.button
            onClick={() => setDialogOpen("add")}
            className="w-10 h-10 rounded-xl seal-gold flex items-center justify-center shadow-md"
            whileTap={{ scale: 0.9 }}
          >
            <Plus className="w-5 h-5 text-white" />
          </motion.button>
        </motion.div>

        {/* Search */}
        <motion.div variants={itemVariants} className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث في القضايا..."
            className="w-full h-11 pr-10 pl-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none"
            dir="rtl"
          />
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </motion.div>

        {/* Cases List */}
        <motion.div variants={containerVariants} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <motion.div key={i} variants={itemVariants} className="legal-card rounded-2xl p-4 h-24 animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <motion.div variants={itemVariants} className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">لا توجد قضايا</p>
              </motion.div>
            ) : (
              filtered.map((c: any, i) => {
                const status = statusConfig[c.status] || statusConfig["قيد النظر"];
                const priority = priorityConfig[c.priority] || priorityConfig["عادية"];
                const StatusIcon = status.icon;
                return (
                  <motion.div
                    key={c.id}
                    variants={itemVariants}
                    layout
                    className="legal-card rounded-2xl p-4 hover-legal cursor-pointer relative"
                    onClick={() => navigate("case-details", { caseId: c.id })}
                  >
                    <div className={`absolute right-0 top-4 bottom-4 w-[3px] rounded-full ${priority.barColor}`} />
                    <div className="pr-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{c.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">#{c.caseNumber}</p>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/50 ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span className="text-[10px] font-medium">{status.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${priority.color}`} />
                        <span className="text-[10px] text-muted-foreground">{priority.label}</span>
                        <span className="text-[10px] text-muted-foreground/50">•</span>
                        <span className="text-[10px] text-muted-foreground">{c.type || "غير محدد"}</span>
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
