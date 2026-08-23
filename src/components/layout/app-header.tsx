"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Menu, Search, Bell } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";

const screenTitles: Record<string, string> = {
  dashboard: "لوحة التحكم",
  cases: "القضايا",
  "case-details": "تفاصيل القضية",
  clients: "الموكلين",
  "client-profile": "الملف الشخصي",
  analytics: "التحليلات",
  laws: "القوانين",
  petitions: "العرائض",
  notes: "المفكرة",
  appointments: "المواعيد",
  settings: "الإعدادات",
  documents: "المستندات",
  subscriptions: "الاشتراكات",
  transactions: "المعاملات المالية",
  admin: "لوحة الإدارة",
};

export function AppHeader({ user }: { user: any }) {
  const { currentScreen, setSidebarOpen, setSearchOpen } = useAppStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const title = screenTitles[currentScreen] || "ميزان العدالة";

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? "glass-legal shadow-sm" : "bg-transparent"
      }`}
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <motion.button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <Menu className="w-4 h-4 text-foreground" />
        </motion.button>

        <AnimatePresence mode="wait">
          <motion.h1
            key={currentScreen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm font-bold text-foreground"
          >
            {title}
          </motion.h1>
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <Search className="w-4 h-4 text-foreground" />
          </motion.button>
          <motion.button
            className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors relative"
            whileTap={{ scale: 0.9 }}
          >
            <Bell className="w-4 h-4 text-foreground" />
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-destructive" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
