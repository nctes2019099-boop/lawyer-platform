"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Moon, Sun, Globe, Database, Shield, LogOut,
  ChevronLeft, Trash2, Download, Upload, Info, Bell
} from "lucide-react";
import { useRef } from "react";
import { useAppStore } from "@/lib/store";
import { toast } from "react-hot-toast";

export function SettingsScreen() {
  const { navigate, setDarkMode, darkMode } = useAppStore();
  const [user, setUser] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/user/profile").then(r => r.json()).then(setUser);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    navigate("login");
  };

  const handleBackup = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("backup failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mizan-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل النسخة الاحتياطية");
    } catch {
      toast.error("تعذّر إنشاء النسخة الاحتياطية");
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "restore failed");
      const total = Object.values(data.counts as Record<string, number>).reduce((a, b) => a + b, 0);
      toast.success(`تمت الاستيراد: ${total} عنصر`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ملف غير صالح");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sections = [
    {
      title: "الحساب",
      items: [
        { icon: User, label: "الملف الشخصي", sub: user?.name || "—", action: () => toast("قريباً") },
        { icon: Bell, label: "الإشعارات", sub: "مفعلة", action: () => toast("قريباً") },
      ]
    },
    {
      title: "المظهر",
      items: [
        { icon: darkMode ? Sun : Moon, label: "الوضع الليلي", sub: darkMode ? "مفعل" : "معطل", action: () => setDarkMode(!darkMode) },
        { icon: Globe, label: "اللغة", sub: "العربية", action: () => toast("قريباً") },
      ]
    },
    {
      title: "البيانات",
      items: [
        { icon: Download, label: "نسخة احتياطية", sub: busy ? "جارٍ..." : "تصدير JSON", action: handleBackup },
        { icon: Upload, label: "استيراد نسخة", sub: "استعادة من ملف", action: () => fileInputRef.current?.click() },
        { icon: Database, label: "مسح ذاكرة التخزين", sub: "—", action: () => { localStorage.clear(); toast.success("تم المسح"); } },
      ]
    },
    {
      title: "النظام",
      items: [
        { icon: Shield, label: "سجل التدقيق", sub: "—", action: () => toast("قريباً") },
        { icon: Info, label: "عن التطبيق", sub: "v2.1.0", action: () => toast("ميزان العدالة v2.1.0") },
      ]
    },
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
        {/* Profile Header */}
        <motion.div variants={itemVariants} className="legal-card rounded-2xl p-5 text-center">
          <div className="w-20 h-20 rounded-2xl seal-gold flex items-center justify-center mx-auto mb-3 shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-base font-bold">{user?.name || "محامي محترف"}</h3>
          <p className="text-xs text-muted-foreground mt-1">{user?.email || "—"}</p>
          <div className="gold-divider my-3" />
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <p className="text-lg font-bold number-magnify text-primary">{user?.cases || 0}</p>
              <p className="text-[10px] text-muted-foreground">قضية</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold number-magnify text-accent">{user?.clients || 0}</p>
              <p className="text-[10px] text-muted-foreground">موكل</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold number-magnify text-emerald-600">{user?.appointments || 0}</p>
              <p className="text-[10px] text-muted-foreground">موعد</p>
            </div>
          </div>
        </motion.div>

        {/* Sections */}
        {sections.map((section) => (
          <motion.div key={section.title} variants={itemVariants}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 mr-1">{section.title}</p>
            <div className="legal-card rounded-2xl overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/30 ${i !== section.items.length - 1 ? "border-b border-border/40" : ""}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.div variants={itemVariants}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full legal-card rounded-2xl p-4 flex items-center gap-3 text-destructive hover:bg-destructive/5 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">تسجيل الخروج</span>
          </button>
        </motion.div>

        <motion.p variants={itemVariants} className="text-center text-[10px] text-muted-foreground/40">
          ميزان العدالة v2.1.0 — صُنع بإتقان
        </motion.p>
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleRestore}
        className="hidden"
      />

      {/* Logout Confirm */}
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
                  <p className="text-sm text-muted-foreground">هل أنت متأكد؟</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-all text-sm font-medium">إلغاء</button>
                <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-all text-sm font-medium">تأكيد</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
