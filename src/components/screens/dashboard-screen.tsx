"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Briefcase, Users, Calendar, Gavel, TrendingUp, 
  Clock, Bell, FileText, ChevronLeft, Scale 
} from "lucide-react";
import { useAppStore } from "@/lib/store";

export function DashboardScreen() {
  const { navigate } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/stats").then(r => r.json()).then(setStats);
    fetch("/api/activities?limit=5").then(r => r.json()).then(d => setActivities(d.activities || []));
  }, []);

  const statItems = [
    { key: "cases", label: "القضايا", icon: Briefcase, color: "from-amber-500/15 to-amber-600/5", iconColor: "text-amber-600", value: stats?.totalCases || 0 },
    { key: "clients", label: "الموكلين", icon: Users, color: "from-accent/15 to-accent-light/5", iconColor: "text-accent", value: stats?.totalClients || 0 },
    { key: "appointments", label: "المواعيد", icon: Calendar, color: "from-emerald-500/15 to-emerald-600/5", iconColor: "text-emerald-600", value: stats?.upcomingAppointments || 0 },
  ];

  const quickActions = [
    { icon: Gavel, label: "قضية جديدة", screen: "cases", action: "add" },
    { icon: Users, label: "موكل جديد", screen: "clients", action: "add" },
    { icon: Calendar, label: "موعد", screen: "appointments", action: "add" },
    { icon: FileText, label: "مذكرة", screen: "notes", action: "add" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-4 pb-24 fingerprint-bg">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-lg mx-auto space-y-4"
      >
        {/* الترحيب */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">مرحباً بك مجدداً</p>
            <h2 className="text-lg font-bold text-foreground">لوحة التحكم</h2>
          </div>
          <motion.div 
            className="w-10 h-10 rounded-full seal-gold flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 10 }}
          >
            <Bell className="w-4 h-4 text-white" />
          </motion.div>
        </motion.div>

        {/* Bento Stats Grid */}
        <div className="bento-grid">
          <motion.div 
            variants={itemVariants}
            className="bento-item-large legal-card rounded-2xl p-5 relative overflow-hidden cursor-pointer"
            onClick={() => navigate("cases")}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${statItems[0].color} opacity-60`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${statItems[0].color} flex items-center justify-center`}>
                  <Briefcase className={`w-5 h-5 ${statItems[0].iconColor}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold number-magnify text-foreground">{statItems[0].value}</p>
              <p className="text-xs text-muted-foreground mt-1">{statItems[0].label}</p>
              <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                نشطة الآن
              </div>
            </div>
          </motion.div>

          {statItems.slice(1).map((stat) => (
            <motion.div
              key={stat.key}
              variants={itemVariants}
              className="legal-card rounded-2xl p-4 relative overflow-hidden hover-legal cursor-pointer"
              onClick={() => navigate(stat.key as any)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-50`} />
              <div className="relative z-10">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
                <p className="text-xl font-bold number-magnify">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* الإجراءات السريعة */}
        <motion.div variants={itemVariants}>
          <p className="text-xs font-medium text-muted-foreground mb-3 mr-1">إجراءات سريعة</p>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action, i) => (
              <motion.button
                key={i}
                className="legal-card rounded-xl p-3 flex flex-col items-center gap-2 hover-legal"
                onClick={() => navigate(action.screen as any, { openAdd: true })}
                whileTap={{ scale: 0.92 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <action.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-foreground">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* آخر النشاطات */}
        <motion.div variants={itemVariants} className="legal-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">آخر النشاطات</h3>
            <button onClick={() => navigate("cases")} className="text-[10px] text-primary flex items-center gap-0.5">
              الكل <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {activities.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                لا توجد نشاطات حديثة
              </div>
            ) : (
              activities.map((activity, i) => (
                <motion.div
                  key={activity.id || i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Scale className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{activity.title}</p>
                    <p className="text-[10px] text-muted-foreground">{activity.description}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                    {new Date(activity.createdAt).toLocaleDateString("ar-EG")}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
