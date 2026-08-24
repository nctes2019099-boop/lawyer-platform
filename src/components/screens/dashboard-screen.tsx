"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, CalendarCheck, Users, Calendar, AlertTriangle, Clock,
  FileText, TrendingUp, ChevronLeft, ChevronRight, Scale, Activity,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getRelativeTime, formatIQD } from "@/lib/utils";

interface DashboardData {
  counts: Record<string, number>;
  winRate: number;
  recentActivities: any[];
  upcomingSessions: any[];
  pendingReminders: any[];
  finance: { monthIncome: number; monthExpenses: number; net: number };
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 18, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 280, damping: 24 } } };

function useAnimatedNumber(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return value;
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "صباح الخير";
  if (h < 18) return "نهارك سعيد";
  return "مساء الخير";
}

function daysUntil(date: string | Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export function DashboardScreen() {
  const { navigate } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<{ name?: string | null; role?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
    fetch("/api/user/profile").then((r) => r.json()).then(setProfile).catch(() => {});
  }, []);

  const c = data?.counts || {};
  const cases = useAnimatedNumber(c.totalCases || 0);
  const consultations = useAnimatedNumber(c.upcomingAppointments || 0);
  const clients = useAnimatedNumber(c.totalClients || 0);

  const nextSession = data?.upcomingSessions?.[0];
  const alerts = (data?.pendingReminders || []).slice(0, 3);
  const finance = data?.finance;

  const monthLabel = new Date(calMonth.y, calMonth.m).toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
  const calendarDays = buildCalendar(calMonth.y, calMonth.m, data?.upcomingSessions || []);

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-lg mx-auto p-4 space-y-4">
      {/* User card */}
      <motion.div variants={item} className="brand-emerald rounded-3xl p-5 text-white relative overflow-hidden shadow-xl shadow-primary/20">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -right-8 w-36 h-36 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/30">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-white/80">{timeOfDay()} 👋</p>
            <h2 className="text-lg font-extrabold">{profile?.name || "محامي محترف"}</h2>
            <p className="text-[11px] text-white/70">{profile?.role || "محامي — نقابة المحامين"}</p>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={cases} label="قضايا نشطة" icon={Briefcase} color="from-emerald-500 to-emerald-600" delta={c.activeCases ? `${c.activeCases} نشطة` : undefined} onClick={() => navigate("cases")} />
        <StatCard value={consultations} label="مواعيد اليوم" icon={CalendarCheck} color="from-amber-500 to-orange-500" onClick={() => navigate("appointments")} />
        <StatCard value={clients} label="إجمالي الموكلين" icon={Users} color="from-sky-500 to-blue-600" delta={c.totalClients ? "+1" : undefined} onClick={() => navigate("clients")} />
      </div>

      {/* Next appointment */}
      {nextSession ? (
        <motion.button variants={item} onClick={() => navigate("case-details", { caseId: nextSession.caseId })} className="w-full text-right legal-card rounded-2xl p-4 hover-legal flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
            <span className="text-[10px] font-medium">{new Date(nextSession.date).toLocaleDateString("ar-EG", { month: "short" })}</span>
            <span className="text-xl font-extrabold leading-none">{new Date(nextSession.date).getDate()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-primary font-semibold">الموعد القادم</p>
            <p className="text-sm font-bold truncate">{new Date(nextSession.date).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })} — {nextSession.case?.title || "جلسة محكمة"}</p>
            <p className="text-[11px] text-muted-foreground truncate">{nextSession.location || nextSession.case?.caseNumber || "—"}</p>
          </div>
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      ) : (
        <motion.div variants={item} className="legal-card rounded-2xl p-4 flex items-center gap-3 text-muted-foreground">
          <CalendarCheck className="w-5 h-5 text-primary" />
          <p className="text-sm">لا توجد مواعيد قادمة</p>
        </motion.div>
      )}

      {/* Mini calendar */}
      <motion.div variants={item} className="legal-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCalMonth(shiftMonth(calMonth, -1))} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
          <p className="text-sm font-bold">{monthLabel}</p>
          <button onClick={() => setCalMonth(shiftMonth(calMonth, 1))} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
          {["ح", "ن", "ث", "ر", "خ", "ج", "س"].map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((d, i) => {
            const today = isSameDay(new Date(), d.date);
            return (
              <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[11px] relative ${today ? "brand-emerald text-white font-bold" : d.currentMonth ? "text-foreground" : "text-muted-foreground/40"}`}>
                {d.day}
                {d.hasEvent && <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${today ? "bg-white" : "bg-primary"}`} />}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div variants={item} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> تنبيهات المواعيد القادمة</p>
          {alerts.map((a) => {
            const days = daysUntil(a.dueAt);
            const cfg = days <= 1 ? { c: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300", icon: AlertTriangle }
              : days <= 3 ? { c: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300", icon: Clock }
              : { c: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300", icon: Calendar };
            const Icon = cfg.icon;
            return (
              <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl ${cfg.c}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-[10px] opacity-80">{days === 0 ? "اليوم" : days === 1 ? "غداً" : `بعد ${days} أيام`}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Activity timeline */}
      <motion.div variants={item} className="legal-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold flex items-center gap-1.5"><Activity className="w-4 h-4 text-primary" /> آخر النشاطات</p>
          <span className="text-[10px] text-muted-foreground">{data?.recentActivities?.length || 0} عناصر</span>
        </div>
        <div className="relative pr-2">
          <span className="absolute right-[7px] top-1 bottom-1 w-0.5 bg-border" />
          <div className="space-y-3">
            {(data?.recentActivities || []).slice(0, 5).map((act, i) => (
              <div key={act.id || i} className="relative flex gap-3">
                <span className="relative z-10 w-4 h-4 rounded-full bg-primary/15 border-2 border-background mt-0.5 shrink-0">
                  <span className="absolute inset-1 rounded-full bg-primary" />
                </span>
                <div className="flex-1 min-w-0 pb-1">
                  <p className="text-xs font-semibold leading-snug">{act.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{getRelativeTime(act.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Monthly performance */}
      {finance && (
        <motion.div variants={item} className="legal-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold">الأداء المالي الشهري</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div><p className="text-lg font-extrabold text-emerald-600 number-magnify">{formatIQD(finance.monthIncome)}</p><p className="text-[10px] text-muted-foreground">الإيرادات</p></div>
            <div><p className="text-lg font-extrabold text-rose-600 number-magnify">{formatIQD(finance.monthExpenses)}</p><p className="text-[10px] text-muted-foreground">المصروفات</p></div>
            <div><p className={`text-lg font-extrabold number-magnify ${finance.net >= 0 ? "text-primary" : "text-rose-600"}`}>{formatIQD(finance.net)}</p><p className="text-[10px] text-muted-foreground">الصافي</p></div>
          </div>
          <button onClick={() => navigate("transactions")} className="w-full py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors flex items-center justify-center gap-1">
            <FileText className="w-3.5 h-3.5" /> عرض التفاصيل المالية
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatCard({ value, label, icon: Icon, color, delta, onClick }: { value: number; label: string; icon: React.ElementType; color: string; delta?: string; onClick?: () => void }) {
  return (
    <motion.button variants={item} onClick={onClick} className="text-right">
      <div className={`bg-gradient-to-br ${color} rounded-2xl p-3 text-white shadow-md relative overflow-hidden h-full`}>
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
        <Icon className="w-5 h-5 mb-1.5 relative z-10" />
        <p className="text-2xl font-extrabold number-magnify relative z-10 leading-none">{value}</p>
        <p className="text-[10px] text-white/85 mt-1 relative z-10">{label}</p>
        {delta && <p className="text-[9px] text-white/70 relative z-10">{delta}</p>}
      </div>
    </motion.button>
  );
}

function buildCalendar(y: number, m: number, sessions: any[]) {
  const first = new Date(y, m, 1);
  const startOffset = (first.getDay() + 0) % 7; // week starts Sat in Iraq
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const eventSet = new Set(sessions.map((s) => new Date(s.date).toDateString()));
  const cells: { day: number; date: Date; currentMonth: boolean; hasEvent: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = prevDays - i;
    const date = new Date(y, m - 1, day);
    cells.push({ day, date, currentMonth: false, hasEvent: eventSet.has(date.toDateString()) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d);
    cells.push({ day: d, date, currentMonth: true, hasEvent: eventSet.has(date.toDateString()) });
  }
  while (cells.length % 7 !== 0) {
    const d = cells.length - daysInMonth - startOffset + 1;
    const date = new Date(y, m + 1, d);
    cells.push({ day: d, date, currentMonth: false, hasEvent: eventSet.has(date.toDateString()) });
  }
  return cells;
}

function shiftMonth({ y, m }: { y: number; m: number }, delta: number) {
  const d = new Date(y, m + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
