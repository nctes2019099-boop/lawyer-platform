"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import {
  X, LayoutDashboard, Briefcase, Users, BookOpen, ScrollText,
  FileText, CalendarDays, BarChart3, Wallet, Settings,
  Shield, LogOut, Crown, Scale, CheckSquare,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

const mainMenu = [
  { key: "dashboard" as const, label: "الرئيسية", icon: LayoutDashboard },
  { key: "cases" as const, label: "القضايا", icon: Briefcase },
  { key: "clients" as const, label: "الموكلين", icon: Users },
  { key: "appointments" as const, label: "المواعيد", icon: CalendarDays },
  { key: "laws" as const, label: "القوانين", icon: BookOpen },
  { key: "petitions" as const, label: "العرائض", icon: ScrollText },
  { key: "notes" as const, label: "المفكرة", icon: FileText },
  { key: "documents" as const, label: "المستندات", icon: FileText },
  { key: "analytics" as const, label: "التحليلات", icon: BarChart3 },
  { key: "transactions" as const, label: "المالية", icon: Wallet },
  { key: "tasks" as const, label: "المهام", icon: CheckSquare },
];

const secondaryMenu = [
  { key: "subscriptions" as const, label: "الاشتراكات", icon: Crown },
  { key: "settings" as const, label: "الإعدادات", icon: Settings },
];

export function SideDrawer({ user }: { user: { name: string; email: string; isAdmin: boolean } | null }) {
  const { sidebarOpen, setSidebarOpen, navigate, currentScreen } = useAppStore();
  const [stats, setStats] = useState({ cases: 0, clients: 0, appointments: 0, notes: 0 });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      fetch("/api/stats")
        .then((r) => r.json())
        .then((data) => {
          setStats({
            cases: data.totalCases || 0,
            clients: data.totalClients || 0,
            appointments: data.totalAppointments || 0,
            notes: data.totalNotes || 0,
          });
        })
        .catch(() => {});
    }
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSidebarOpen(false);
    navigate("login");
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: (i: number) => ({
      opacity: 1, x: 0,
      transition: { delay: i * 0.04, duration: 0.3 },
    }),
  };

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-background border-l border-border z-50 overflow-y-auto scrollbar-none"
            >
              {/* Header */}
              <div className="p-5 border-b border-border/60 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-2xl seal-gold flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-lg">
                        {user?.name ? getInitials(user.name) : "م"}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[avatarShimmer_3s_infinite]" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{user?.name || "محامي محترف"}</p>
                        <p className="text-[11px] text-muted-foreground">{user?.email || ""}</p>
                      </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "قضايا", value: stats.cases, color: "text-amber-600" },
                      { label: "موكلين", value: stats.clients, color: "text-accent" },
                      { label: "مواعيد", value: stats.appointments, color: "text-emerald-600" },
                      { label: "مفكرة", value: stats.notes, color: "text-primary" },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center p-2 rounded-xl bg-secondary/40 border border-border/30">
                        <p className={`text-lg font-extrabold ${stat.color}`}>{stat.value}</p>
                        <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Menu */}
              <div className="p-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                  القائمة الرئيسية
                </p>
                <ul className="space-y-1">
                  {mainMenu.map((item, i) => {
                    const isActive = currentScreen === item.key;
                    return (
                      <motion.li key={item.key} custom={i} variants={menuItemVariants} initial="hidden" animate="visible">
                        <button
                          onClick={() => { navigate(item.key); setSidebarOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] ${
                            isActive ? "bg-primary/8 border-r-2 border-primary" : "hover:bg-secondary/60"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isActive ? "seal-gold text-white shadow-md" : "bg-secondary text-muted-foreground"
                          }`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className={`text-sm ${isActive ? "font-bold text-primary" : "font-medium"}`}>
                            {item.label}
                          </span>
                          {isActive && (
                            <motion.div layoutId="sidebar-active-dot" className="mr-auto w-2 h-2 rounded-full bg-primary" />
                          )}
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>

                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-3">
                  إعدادات
                </p>
                <ul className="space-y-1">
                  {secondaryMenu.map((item, i) => {
                    const isActive = currentScreen === item.key;
                    return (
                      <motion.li key={item.key} custom={i + mainMenu.length + 0.15} variants={menuItemVariants} initial="hidden" animate="visible">
                        <button
                          onClick={() => { navigate(item.key); setSidebarOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] ${
                            isActive ? "bg-primary/8 border-r-2 border-primary" : "hover:bg-secondary/60"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isActive ? "seal-gold text-white shadow-md" : "bg-secondary text-muted-foreground"
                          }`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className={`text-sm ${isActive ? "font-bold text-primary" : "font-medium"}`}>
                            {item.label}
                          </span>
                        </button>
                      </motion.li>
                    );
                  })}
                  {user?.isAdmin && (
                    <motion.li custom={mainMenu.length + secondaryMenu.length + 0.3} variants={menuItemVariants} initial="hidden" animate="visible">
                      <button
                        onClick={() => { navigate("admin"); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] ${
                          currentScreen === "admin" ? "bg-primary/8 border-r-2 border-primary" : "hover:bg-secondary/60"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          currentScreen === "admin" ? "seal-gold text-white shadow-md" : "bg-secondary text-muted-foreground"
                        }`}>
                          <Shield className="w-4 h-4" />
                        </div>
                        <span className={`text-sm ${currentScreen === "admin" ? "font-bold text-primary" : "font-medium"}`}>
                          لوحة الإدارة
                        </span>
                      </button>
                    </motion.li>
                  )}
                </ul>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/60 bg-background">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/5 transition-all active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">تسجيل الخروج</span>
                </button>
                <p className="text-center text-[9px] text-muted-foreground/40 mt-2">
                  ميزان العدالة © 2026
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold">تسجيل الخروج</h3>
                  <p className="text-sm text-muted-foreground">هل أنت متأكد من رغبتك في تسجيل الخروج؟</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-all text-sm font-medium">
                  إلغاء
                </button>
                <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-all text-sm font-medium">
                  تأكيد
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
