"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Briefcase, Users, CheckCircle2, TrendingUp, CalendarDays,
} from "lucide-react";

type Range = "week" | "month" | "quarter" | "all";

const ranges: { key: Range; label: string }[] = [
  { key: "week", label: "أسبوع" },
  { key: "month", label: "شهر" },
  { key: "quarter", label: "ربع سنوي" },
  { key: "all", label: "الكل" },
];

export function AnalyticsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [range, setRange] = useState<Range>("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/cases?limit=200").then((r) => r.json()),
      fetch("/api/clients?limit=200").then((r) => r.json()),
    ]).then(([s, cs, cl]) => {
      setStats(s); setCases(Array.isArray(cs) ? cs : []); setClients(Array.isArray(cl) ? cl : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cutoff = useMemo(() => {
    const now = new Date();
    if (range === "week") return new Date(now.getTime() - 7 * 86400000);
    if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
    if (range === "quarter") return new Date(now.getFullYear(), now.getMonth() - 3, 1);
    return new Date(0);
  }, [range]);

  const filteredCases = useMemo(() => cases.filter((c) => new Date(c.createdAt) >= cutoff), [cases, cutoff]);

  const total = filteredCases.length;
  const completed = filteredCases.filter((c) => c.status === "مكتملة").length;
  const active = filteredCases.filter((c) => ["قيد النظر", "جاري التنفيذ"].includes(c.status)).length;
  const winRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const newClients = clients.filter((c) => new Date(c.createdAt) >= cutoff).length;

  const statusCounts = countBy(filteredCases, (c) => c.status || "قيد النظر");
  const typeCounts = countBy(filteredCases, (c) => c.type || "مدني");

  const monthlyTrend = useMemo(() => buildMonthlyTrend(cases), [cases]);
  const clientAcquisition = useMemo(() => buildMonthlyTrend(clients, true), [clients]);

  const kpis = [
    { label: "إجمالي القضايا", value: total, icon: Briefcase, color: "text-emerald-600", trend: total > 0 ? `+${Math.round(total * 0.1)}` : "—" },
    { label: "نشطة", value: active, icon: CalendarDays, color: "text-amber-600", trend: "—" },
    { label: "مكتملة", value: completed, icon: CheckCircle2, color: "text-primary", trend: `${winRate}%` },
    { label: "نسبة الإنجاز", value: `${winRate}%`, icon: TrendingUp, color: "text-sky-600", trend: winRate >= 50 ? "↑" : "↓" },
    { label: "موكلين", value: clients.length, icon: Users, color: "text-purple-600", trend: `+${newClients}` },
    { label: "متابعة", value: stats?.upcomingAppointments || 0, icon: CalendarDays, color: "text-rose-600", trend: "قادمة" },
  ];

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl brand-emerald flex items-center justify-center shadow-md shadow-primary/20"><BarChart3 className="w-5 h-5 text-white" /></div>
          <div><h2 className="text-lg font-extrabold">الإحصائيات والتحليلات</h2><p className="text-[11px] text-muted-foreground">نظرة شاملة على الأداء</p></div>
        </div>
      </div>

      <div className="flex gap-1.5 bg-secondary/50 rounded-xl p-1">
        {ranges.map((r) => (
          <button key={r.key} onClick={() => setRange(r.key)} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${range === r.key ? "brand-emerald text-white shadow" : "text-muted-foreground"}`}>{r.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {kpis.map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="legal-card rounded-xl p-3">
            <k.icon className={`w-4 h-4 mb-1.5 ${k.color}`} />
            <p className="text-xl font-extrabold number-magnify">{k.value}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center justify-between">
              <span>{k.label}</span>
              <span className="text-primary font-semibold">{k.trend}</span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ChartCard title="توزيع الحالات">
          <Donut data={statusCounts} colors={["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#64748b"]} />
        </ChartCard>
        <ChartCard title="توزيع الأنواع">
          <Donut data={typeCounts} colors={["#0ea5e9", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6"]} />
        </ChartCard>
      </div>

      <ChartCard title="أنواع القضايا">
        <TypeBar data={typeCounts} />
      </ChartCard>

      <ChartCard title="الاتجاه الشهري (آخر 6 أشهر)">
        <TrendChart data={monthlyTrend} />
      </ChartCard>

      <ChartCard title="نمو الموكلين">
        <TrendChart data={clientAcquisition} color="#6366f1" />
      </ChartCard>
    </div>
  );
}

function countBy<T>(arr: T[], key: (x: T) => string): Record<string, number> {
  return arr.reduce((acc, x) => { const k = key(x); acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>);
}

function buildMonthlyTrend(items: any[], isClient = false) {
  const now = new Date();
  const out: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = items.filter((x) => {
      const dt = new Date(x.createdAt);
      return dt >= d && dt < next;
    }).length;
    out.push({ label: d.toLocaleDateString("ar-EG", { month: "short" }), value: count });
  }
  return out;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="legal-card rounded-2xl p-4">
      <p className="text-xs font-bold mb-3">{title}</p>
      {children}
    </div>
  );
}

function Donut({ data, colors }: { data: Record<string, number>; colors: string[] }) {
  const entries = Object.entries(data);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const r = 36, cx = 50, cy = 50, C = 2 * Math.PI * r;
  let offset = 0;
  if (total === 0) return <p className="text-center text-xs text-muted-foreground py-6">لا توجد بيانات</p>;
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="12" />
        {entries.map(([k, v], i) => {
          const len = (v / total) * C;
          const seg = <circle key={k} cx={cx} cy={cy} r={r} fill="none" stroke={colors[i % colors.length]} strokeWidth="12" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} strokeLinecap="round" />;
          offset += len;
          return seg;
        })}
        <text x="50" y="52" textAnchor="middle" className="fill-foreground font-bold" style={{ fontSize: 16, transform: "rotate(90deg)", transformOrigin: "center" }}>{total}</text>
      </svg>
      <div className="flex-1 space-y-1 min-w-0">
        {entries.slice(0, 4).map(([k, v], i) => (
          <div key={k} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
            <span className="truncate text-muted-foreground flex-1">{k}</span>
            <span className="font-bold">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeBar({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  if (!entries.length) return <p className="text-center text-xs text-muted-foreground py-4">لا توجد بيانات</p>;
  return (
    <div className="space-y-2">
      {entries.map(([k, v], i) => (
        <div key={k}>
          <div className="flex justify-between text-[10px] mb-0.5"><span className="text-muted-foreground">{k}</span><span className="font-bold">{v}</span></div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(v / max) * 100}%` }} transition={{ delay: i * 0.08, duration: 0.6 }} className="h-full rounded-full brand-emerald" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ data, color = "#10b981" }: { data: { label: string; value: number }[]; color?: string }) {
  const W = 300, H = 110, pad = 20;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = (W - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [pad + i * step, H - pad - (d.value / max) * (H - pad * 2)]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0]},${H - pad} L${pts[0][0]},${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="3" fill={color} />
          <text x={p[0]} y={H - 4} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 8 }}>{data[i].label}</text>
        </g>
      ))}
    </svg>
  );
}
