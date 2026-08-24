"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Menu, Search, Bell, Shield, Command } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { getRelativeTime } from "@/lib/utils";

const screenTitles: Record<string, string> = {
  dashboard: "الرئيسية",
  cases: "القضايا",
  "case-details": "تفاصيل القضية",
  clients: "الموكلين",
  "client-profile": "ملف الموكل",
  analytics: "الإحصائيات",
  laws: "القوانين",
  petitions: "العرائض",
  notes: "المفكرة",
  "note-editor": "محرر الملاحظات",
  appointments: "المواعيد",
  settings: "الإعدادات",
  documents: "المستندات",
  subscriptions: "الاشتراكات",
  transactions: "المالية",
  admin: "لوحة الإدارة",
  tasks: "المهام",
  login: "تسجيل الدخول",
};

function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "صباح الخير";
  if (h < 18) return "نهارك سعيد";
  return "مساء الخير";
}

export function AppHeader({ user }: { user: { name?: string | null } | null }) {
  const { currentScreen, setSidebarOpen, setSearchOpen, setNotificationsOpen } = useAppStore();
  const [scrolled, setScrolled] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d: unknown) => {
          if (!active || !Array.isArray(d)) return;
          setUnread(d.filter((n: { read?: boolean }) => !n.read).length);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  const isDashboard = currentScreen === "dashboard";
  const title = screenTitles[currentScreen] || "محامي محترف";
  const today = new Date();
  const dateLabel = today.toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });

  return (
    <motion.header
      initial={{ y: -70 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed top-0 inset-x-0 z-40 pt-safe transition-all duration-300 ${
        scrolled ? "glass-legal shadow-sm" : "bg-transparent"
      }`}
    >
      <div
        className={`max-w-lg mx-auto px-4 flex items-center justify-between gap-2 transition-all duration-300 ${
          isDashboard ? "h-[84px]" : "h-[60px]"
        }`}
      >
        <motion.button
          onClick={() => setSidebarOpen(true)}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
          aria-label="القائمة"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </motion.button>

        <div className="flex-1 flex flex-col items-center min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-primary" />
              <h1 className="text-sm font-bold text-foreground truncate">{title}</h1>
            </motion.div>
          </AnimatePresence>
          {isDashboard && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[11px] text-muted-foreground mt-0.5 truncate"
            >
              {greeting()} {user?.name ? `، ${user.name.split(" ")[0]}` : ""} — {dateLabel}
            </motion.p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative group">
            <motion.button
              onClick={() => setSearchOpen(true)}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
              aria-label="بحث"
            >
              <Search className="w-5 h-5 text-foreground" />
            </motion.button>
            <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 text-[9px] font-mono bg-foreground text-background px-1.5 py-0.5 rounded shadow whitespace-nowrap">
              <Command className="w-2.5 h-2.5" /> K
            </span>
          </div>

          <motion.button
            onClick={() => setNotificationsOpen(true)}
            whileTap={{ scale: 0.9 }}
            className="relative w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
            aria-label="الإشعارات"
          >
            <Bell className="w-5 h-5 text-foreground" />
            <AnimatePresence>
              {unread > 0 && (
                <motion.span
                  key={unread}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center shadow ring-2 ring-background"
                >
                  {unread > 99 ? "99+" : unread}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
      <div className="h-px bg-gradient-to-l from-transparent via-primary/25 to-transparent" />
    </motion.header>
  );
}
