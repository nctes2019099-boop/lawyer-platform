"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, DollarSign, Briefcase, Users } from "lucide-react";

export function AnalyticsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/stats").then(r => r.json()).then(setStats);
    fetch("/api/cases?limit=200").then(r => r.json()).then(d => setCases(Array.isArray(d) ? d : []));
  }, []);

  const totalCases = cases.length;
  const completedCases = cases.filter((c: any) => c.status === "مكتملة").length;
  const winRate = totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0;

  const statusCounts = cases.reduce((acc: Record<string, number>, c: any) => {
    acc[c.status || "قيد النظر"] = (acc[c.status || "قيد النظر"] || 0) + 1;
    return acc;
  }, {});

  const kpiCards = [
    { label: "نسبة الفوز", value: `${winRate}%`, icon: TrendingUp, color: "text-emerald-600", bg: "from-emerald-500/15 to-emerald-600/5" },
    { label: "القضايا النشطة", value: totalCases - completedCases, icon: Briefcase, color: "text-amber-600", bg: "from-amber-500/15 to-amber-600/5" },
    { label: "الموكلين", value: stats?.totalClients || 0, icon: Users, color: "text-accent", bg: "from-accent/15 to-accent-light/5" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-4 pb-24 fingerprint-bg">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-lg mx-auto space-y-4">
        <motion.div variants={itemVariants}>
          <p className="text-xs text-muted-foreground">تحليل الأداء</p>
          <h2 className="text-lg font-bold text-foreground">التحليلات</h2>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3">
          {kpiCards.map((kpi) => (
            <motion.div key={kpi.label} variants={itemVariants} className="legal-card rounded-2xl p-3 text-center">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.bg} flex items-center justify-center mx-auto mb-2`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-lg font-bold number-magnify">{kpi.value}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Status Distribution */}
        <motion.div variants={itemVariants} className="legal-card rounded-2xl p-4">
          <h3 className="text-sm font-bold mb-4">توزيع حالات القضايا</h3>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
              const colors: Record<string, string> = {
                "قيد النظر": "bg-amber-500",
                "جاري التنفيذ": "bg-emerald-500",
                مكتملة: "bg-emerald-700",
                مؤجلة: "bg-primary",
                مرفوضة: "bg-destructive",
              };
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{status}</span>
                    <span className="text-[10px] text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${colors[status] || "bg-primary"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Monthly Trend Placeholder */}
        <motion.div variants={itemVariants} className="legal-card rounded-2xl p-4">
          <h3 className="text-sm font-bold mb-3">النشاط الشهري</h3>
          <div className="flex items-end justify-between h-32 gap-2">
            {[40, 65, 45, 80, 55, 70].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-primary/30 to-primary/60"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"].map((m) => (
              <span key={m} className="text-[9px] text-muted-foreground flex-1 text-center">{m}</span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
