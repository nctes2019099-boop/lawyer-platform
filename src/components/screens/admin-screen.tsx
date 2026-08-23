"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Briefcase, Crown, BarChart3, Settings } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "react-hot-toast";

export function AdminScreen() {
  const { navigate } = useAppStore();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then(r => r.json()).catch(() => ({})).then(setStats),
      fetch("/api/admin/users").then(r => r.json()).catch(() => []).then((d) => setUsers(Array.isArray(d) ? d : [])),
    ]).finally(() => setLoading(false));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen p-4 pb-24 fingerprint-bg">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-lg mx-auto space-y-4">
        <motion.div variants={itemVariants}>
          <p className="text-xs text-muted-foreground">لوحة التحكم</p>
          <h2 className="text-lg font-bold text-foreground">لوحة الإدارة</h2>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <div className="legal-card rounded-2xl p-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold number-magnify">{stats?.totalUsers || 0}</p>
            <p className="text-[10px] text-muted-foreground">المستخدمين</p>
          </div>
          <div className="legal-card rounded-2xl p-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-bold number-magnify">{stats?.totalCases || 0}</p>
            <p className="text-[10px] text-muted-foreground">القضايا</p>
          </div>
          <div className="legal-card rounded-2xl p-4">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
              <Crown className="w-4 h-4 text-accent" />
            </div>
            <p className="text-xl font-bold number-magnify">{stats?.totalSubscriptions || 0}</p>
            <p className="text-[10px] text-muted-foreground">الاشتراكات</p>
          </div>
          <div className="legal-card rounded-2xl p-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-bold number-magnify">{stats?.totalRevenue?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-muted-foreground">الإيرادات</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="flex gap-1.5">
          {[
            { key: "users", label: "المستخدمين", icon: Users },
            { key: "plans", label: "الخطط", icon: Crown },
            { key: "settings", label: "الإعدادات", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Users List */}
        {activeTab === "users" && (
          <motion.div variants={containerVariants} className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <motion.div key={i} variants={itemVariants} className="legal-card rounded-2xl p-4 h-16 animate-pulse" />)
            ) : users.length === 0 ? (
              <motion.div variants={itemVariants} className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">لا يوجد مستخدمين</p>
              </motion.div>
            ) : (
              users.map((u: any) => (
                <motion.div key={u.id} variants={itemVariants} className="legal-card rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl seal-gold flex items-center justify-center text-white font-bold text-sm">
                      {(u.name || "م").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                    </div>
                    {u.isAdmin && (
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">أدمن</span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "plans" && (
          <motion.div variants={itemVariants} className="legal-card rounded-2xl p-8 text-center">
            <Crown className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">إدارة الخطط قريباً</p>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div variants={itemVariants} className="legal-card rounded-2xl p-8 text-center">
            <Settings className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">إعدادات النظام قريباً</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
