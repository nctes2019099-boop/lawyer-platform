"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, Briefcase, Users, BookOpen, Plus, 
  Gavel, Calendar, FileText, ScrollText, X 
} from "lucide-react";
import { useAppStore } from "@/lib/store";

const navItems = [
  { key: "dashboard", icon: Home, label: "الرئيسية" },
  { key: "cases", icon: Briefcase, label: "القضايا" },
  { key: "clients", icon: Users, label: "الموكلين" },
  { key: "laws", icon: BookOpen, label: "القوانين" },
];

const fabActions = [
  { icon: Gavel, label: "قضية", screen: "cases" },
  { icon: Users, label: "موكل", screen: "clients" },
  { icon: Calendar, label: "موعد", screen: "appointments" },
  { icon: FileText, label: "مذكرة", screen: "notes" },
  { icon: ScrollText, label: "عرض", screen: "petitions" },
];

export function BottomNav() {
  const { currentScreen, navigate } = useAppStore();
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe">
        <div className="w-full max-w-lg px-4 pb-4">
          <AnimatePresence>
            {fabOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 mb-2"
              >
                {fabActions.map((action, i) => (
                  <motion.button
                    key={action.screen}
                    initial={{ opacity: 0, y: 20, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.5 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      navigate(action.screen as any, { openAdd: true });
                      setFabOpen(false);
                    }}
                    className="flex items-center gap-3 bg-card border border-border/50 rounded-full pl-4 pr-2 py-2 shadow-lg hover-legal"
                  >
                    <div className="w-8 h-8 rounded-full seal-gold flex items-center justify-center">
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass-legal rounded-2xl px-2 py-2 flex items-center justify-around relative">
            {navItems.map((item) => {
              const isActive = currentScreen === item.key;
              return (
                <motion.button
                  key={item.key}
                  onClick={() => navigate(item.key as any)}
                  className="relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors"
                  whileTap={{ scale: 0.88 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon 
                    className={`w-5 h-5 transition-colors ${isActive ? "text-primary fill-primary/20" : "text-muted-foreground"}`} 
                  />
                  <span className={`text-[9px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}

            <motion.button
              onClick={() => setFabOpen(!fabOpen)}
              className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full seal-gold flex items-center justify-center shadow-lg shadow-primary/30 z-10"
              whileTap={{ scale: 0.88 }}
              animate={{ rotate: fabOpen ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {fabOpen ? <X className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}
