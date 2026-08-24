"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, ScreenName } from "@/lib/store";
import {
  X, LayoutDashboard, Briefcase, Users, FileText, BookOpen, ScrollText,
  StickyNote, BarChart3, Wallet, CreditCard, Settings, Cloud,
  Moon, Sun, Info, LogOut, Shield,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { toast } from "react-hot-toast";

const mainMenu: { key: ScreenName; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { key: "cases", label: "القضايا", icon: Briefcase },
  { key: "clients", label: "الموكلين", icon: Users },
  { key: "documents", label: "المستندات", icon: FileText },
  { key: "laws", label: "القوانين", icon: BookOpen },
  { key: "petitions", label: "العرائض", icon: ScrollText },
  { key: "notes", label: "المفكرة", icon: StickyNote },
  { key: "analytics", label: "الإحصائيات", icon: BarChart3 },
  { key: "transactions", label: "المالية", icon: Wallet },
  { key: "subscriptions", label: "الاشتراكات", icon: CreditCard },
];

export function SideDrawer({ user }: { user: { name?: string | null; email?: string | null; role?: string | null; isAdmin?: boolean } | null }) {
  const { sidebarOpen, setSidebarOpen, navigate, currentScreen, darkMode, setDarkMode } = useAppStore();
  const [stats, setStats] = useState({ cases: 0, appointments: 0, clients: 0 });
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      fetch("/api/stats")
        .then((r) => r.json())
        .then((d) =>
          setStats({
            cases: d.activeCases ?? d.totalCases ?? 0,
            appointments: d.upcomingAppointments ?? d.totalAppointments ?? 0,
            clients: d.totalClients ?? 0,
          })
        )
        .catch(() => {});
    }
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSidebarOpen(false);
    navigate("login");
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.035, duration: 0.28 } }),
  };

  const statCards = [
    { label: "قضايا نشطة", value: stats.cases, color: "text-emerald-600", icon: Briefcase },
    { label: "مواعيد اليوم", value: stats.appointments, color: "text-amber-600", icon: Info },
    { label: "إجمالي الموكلين", value: stats.clients, color: "text-sky-600", icon: Users },
  ];

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
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed top-0 right-0 bottom-0 w-[320px] max-w-[86vw] bg-background border-l border-border z-50 flex flex-col overflow-hidden"
            >
              {/* Gradient header */}
              <div className="relative p-5 brand-emerald text-white overflow-hidden">
                <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-10 right-10 w-24 h-24 rounded-full bg-white/10" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-xl border-2 border-white/40 overflow-hidden">
                        {user?.name ? getInitials(user.name) : <Shield className="w-6 h-6" />}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[avatarShimmer_3s_infinite]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{user?.name || "محامي محترف"}</p>
                        <p className="text-[11px] text-white/80 truncate">{user?.email || ""}</p>
                        <p className="text-[10px] text-white/70 mt-0.5">{user?.role || "محامي"}</p>
                      </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-xl hover:bg-white/15 flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {statCards.map((s) => (
                      <div key={s.label} className="text-center p-2 rounded-xl bg-white/10 backdrop-blur border border-white/10">
                        <s.icon className={`w-3.5 h-3.5 mx-auto mb-1 ${s.color === "text-emerald-600" ? "text-emerald-200" : s.color === "text-amber-600" ? "text-amber-200" : "text-sky-200"}`} />
                        <p className="text-lg font-extrabold leading-none">{s.value}</p>
                        <p className="text-[9px] text-white/75 mt-1 leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scrollable menu */}
              <div className="flex-1 overflow-y-auto scrollbar-none p-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">القائمة الرئيسية</p>
                <ul className="space-y-0.5">
                  {mainMenu.map((item, i) => {
                    const isActive = currentScreen === item.key;
                    return (
                      <motion.li key={item.key} custom={i} variants={itemVariants} initial="hidden" animate="visible">
                        <button
                          onClick={() => { navigate(item.key); setSidebarOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                            isActive ? "bg-primary/10 border-r-2 border-primary" : "hover:bg-secondary/60"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? "brand-emerald text-white shadow" : "bg-secondary text-muted-foreground"}`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className={`text-sm flex-1 text-right ${isActive ? "font-bold text-primary" : "font-medium"}`}>{item.label}</span>
                          {isActive && <motion.span layoutId="sidebar-dot" className="w-2 h-2 rounded-full bg-primary" />}
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>

                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-3">أدوات إضافية</p>
                <ul className="space-y-0.5">
                  <li>
                    <button onClick={() => { setSidebarOpen(false); navigate("settings"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60">
                      <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center"><Settings className="w-4 h-4" /></div>
                      <span className="text-sm font-medium flex-1 text-right">الإعدادات</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={() => { window.open("/api/backup", "_blank"); toast.success("يتم تنزيل النسخة الاحتياطية"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60">
                      <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center"><Cloud className="w-4 h-4" /></div>
                      <span className="text-sm font-medium flex-1 text-right">النسخ الاحتياطي</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60">
                      <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center">{darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</div>
                      <span className="text-sm font-medium flex-1 text-right">{darkMode ? "الوضع الفاتح" : "الوضع الداكن"}</span>
                    </button>
                  </li>
                  <li>
                    <button onClick={() => toast("محامي محترف v2.0 — منصة إدارة مكاتب المحاماة")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60">
                      <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center"><Info className="w-4 h-4" /></div>
                      <span className="text-sm font-medium flex-1 text-right">حول التطبيق</span>
                    </button>
                  </li>
                  {user?.isAdmin && (
                    <li>
                      <button onClick={() => { setSidebarOpen(false); navigate("admin"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center"><Shield className="w-4 h-4" /></div>
                        <span className="text-sm font-medium flex-1 text-right">لوحة الإدارة</span>
                      </button>
                    </li>
                  )}
                </ul>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-background">
                <button onClick={() => setShowLogout(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/5">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center"><LogOut className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">تسجيل الخروج</span>
                </button>
                <p className="text-center text-[9px] text-muted-foreground/60 mt-2">محامي محترف v2.0 — صُنع بحب في العراق ⚖️</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowLogout(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center"><LogOut className="w-5 h-5 text-destructive" /></div>
                <div>
                  <h3 className="font-bold">تسجيل الخروج</h3>
                  <p className="text-sm text-muted-foreground">هل أنت متأكد من رغبتك في تسجيل الخروج؟</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowLogout(false)} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm font-medium">إلغاء</button>
                <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl bg-destructive text-white hover:opacity-90 text-sm font-medium">تأكيد</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
