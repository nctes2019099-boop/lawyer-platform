"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { ArrowRight, Briefcase, Calendar, FileText, User, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  "قيد النظر": { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/30", label: "قيد النظر" },
  "جاري التنفيذ": { color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/30", label: "جاري التنفيذ" },
  مكتملة: { color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-950/30", label: "مكتملة" },
  مؤجلة: { color: "text-primary", bg: "bg-primary/10", label: "مؤجلة" },
  مرفوضة: { color: "text-destructive", bg: "bg-destructive/10", label: "مرفوضة" },
};

const priorityConfig: Record<string, { color: string; bar: string }> = {
  عادية: { color: "text-emerald-600", bar: "bg-emerald-500" },
  مهمة: { color: "text-amber-600", bar: "bg-amber-500" },
  عاجلة: { color: "text-rose-500", bar: "bg-rose-500" },
  حرجة: { color: "text-destructive", bar: "bg-destructive" },
};

export function CaseDetailsScreen() {
  const { selectedCaseId, goBack } = useAppStore();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedCaseId) return;
    fetch(`/api/cases/${selectedCaseId}`)
      .then((r) => r.json())
      .then((data) => { setCaseData(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedCaseId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 pt-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen p-4 pt-16 flex items-center justify-center">
        <p className="text-muted-foreground">القضية غير موجودة</p>
      </div>
    );
  }

  const status = statusConfig[caseData.status] || statusConfig["قيد النظر"];
  const priority = priorityConfig[caseData.priority] || priorityConfig["عادية"];

  return (
    <div className="min-h-screen p-4 pb-24 fingerprint-bg">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-lg mx-auto space-y-4">
        {/* Back + Title */}
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <button onClick={goBack} className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">تفاصيل القضية</p>
            <h2 className="text-base font-bold truncate">{caseData.title}</h2>
          </div>
        </motion.div>

        {/* Priority Bar */}
        <motion.div variants={itemVariants} className={`h-1 rounded-full ${priority.bar} w-full`} />

        {/* Main Info Card */}
        <motion.div variants={itemVariants} className="legal-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl seal-gold flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">{caseData.title}</h3>
              <p className="text-xs text-muted-foreground">#{caseData.caseNumber}</p>
            </div>
          </div>

          <div className="gold-divider my-3" />

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/30 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground mb-1">الحالة</p>
              <span className={`text-xs font-medium px-2 py-1 rounded-md ${status.bg} ${status.color}`}>{status.label}</span>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground mb-1">الأولوية</p>
              <span className={`text-xs font-medium ${priority.color}`}>{caseData.priority || "عادية"}</span>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground mb-1">النوع</p>
              <p className="text-xs font-medium">{caseData.type || "—"}</p>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground mb-1">تاريخ الإنشاء</p>
              <p className="text-xs font-medium">{new Date(caseData.createdAt).toLocaleDateString("ar-EG")}</p>
            </div>
          </div>
        </motion.div>

        {/* Description */}
        {caseData.description && (
          <motion.div variants={itemVariants} className="legal-card rounded-2xl p-4">
            <p className="text-[10px] text-muted-foreground mb-2">الوصف</p>
            <p className="text-sm text-foreground leading-relaxed">{caseData.description}</p>
          </motion.div>
        )}

        {/* Client Info */}
        {caseData.client && (
          <motion.div variants={itemVariants} className="legal-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                <User className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium">{caseData.client.name}</p>
                <p className="text-[11px] text-muted-foreground">{caseData.client.phone || "—"}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
