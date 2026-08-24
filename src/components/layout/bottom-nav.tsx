"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Briefcase, Users, Scale, Plus,
  UserPlus, CalendarDays, StickyNote, FilePlus, ScrollText, X,
} from "lucide-react";
import { useAppStore, ScreenName } from "@/lib/store";

const navItems: { key: ScreenName; icon: React.ElementType; label: string; alsoActive: ScreenName[] }[] = [
  { key: "dashboard", icon: Home, label: "الرئيسية", alsoActive: [] },
  { key: "cases", icon: Briefcase, label: "القضايا", alsoActive: ["case-details"] },
  { key: "clients", icon: Users, label: "الموكلين", alsoActive: ["client-profile"] },
  { key: "laws", icon: Scale, label: "القوانين", alsoActive: [] },
];

const fabActions: { icon: React.ElementType; label: string; screen: ScreenName }[] = [
  { icon: Briefcase, label: "إضافة قضية", screen: "cases" },
  { icon: UserPlus, label: "إضافة موكل", screen: "clients" },
  { icon: CalendarDays, label: "موعد جديد", screen: "appointments" },
  { icon: StickyNote, label: "مفكرة جديدة", screen: "notes" },
  { icon: FilePlus, label: "إضافة مستند", screen: "documents" },
  { icon: ScrollText, label: "عريضة جديدة", screen: "petitions" },
];

export function BottomNav() {
  const { currentScreen, navigate } = useAppStore();
  const [fabOpen, setFabOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fabOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) setFabOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [fabOpen]);

  return (
    <>
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      <div ref={sheetRef} className="fixed bottom-0 inset-x-0 z-50 flex justify-center pb-safe pointer-events-none">
        <div className="w-full max-w-lg px-4 pb-3 pointer-events-auto">
          <AnimatePresence>
            {fabOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                className="absolute bottom-[76px] left-1/2 -translate-x-1/2 flex flex-col items-stretch gap-2 mb-2 w-56"
              >
                {fabActions.map((action, i) => (
                  <motion.button
                    key={action.screen}
                    initial={{ opacity: 0, x: -30, scale: 0.7 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.7 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => {
                      navigate(action.screen, { openAdd: true });
                      setFabOpen(false);
                    }}
                    className="flex items-center gap-3 bg-card border border-border/60 rounded-full pr-2 pl-4 py-2 shadow-xl hover:bg-secondary transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full brand-emerald flex items-center justify-center shadow">
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass-legal rounded-2xl px-1 py-1.5 flex items-center justify-around relative shadow-lg border border-border/50">
            {navItems.slice(0, 2).map((item) => (
              <NavButton key={item.key} item={item} currentScreen={currentScreen} navigate={navigate} />
            ))}

            <div className="w-16 shrink-0" />

            {navItems.slice(2).map((item) => (
              <NavButton key={item.key} item={item} currentScreen={currentScreen} navigate={navigate} />
            ))}

            <motion.button
              onClick={() => setFabOpen((v) => !v)}
              className="absolute -top-4 left-1/2 -translate-x-1/2 w-[52px] h-[52px] rounded-full brand-emerald flex items-center justify-center shadow-lg shadow-primary/40 z-10"
              whileTap={{ scale: 0.9 }}
              animate={{ rotate: fabOpen ? 135 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              aria-label="إجراءات سريعة"
            >
              {fabOpen ? <X className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
              {fabOpen && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-primary"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}

function NavButton({
  item,
  currentScreen,
  navigate,
}: {
  item: { key: ScreenName; icon: React.ElementType; label: string; alsoActive: ScreenName[] };
  currentScreen: ScreenName;
  navigate: ReturnType<typeof useAppStore.getState>["navigate"];
}) {
  const isActive = currentScreen === item.key || item.alsoActive.includes(currentScreen);
  return (
    <motion.button
      onClick={() => navigate(item.key)}
      className="relative flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-colors flex-1"
      whileTap={{ scale: 0.9 }}
    >
      {isActive && (
        <motion.div
          layoutId="nav-active-top"
          className="absolute top-0 inset-x-4 h-[3px] bg-primary rounded-full"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <item.icon
        className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
        fill={isActive ? "rgba(16,185,129,0.18)" : "none"}
      />
      <span className={`text-[10px] font-medium ${isActive ? "text-primary font-bold" : "text-muted-foreground"}`}>
        {item.label}
      </span>
    </motion.button>
  );
}
