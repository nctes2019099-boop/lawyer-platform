"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";

interface LoginScreenProps {
  onLogin: (user: { id: string; name: string; email: string; isAdmin: boolean }) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => handleAutoLogin(), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAutoLogin = async () => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@lawyer.com", password: "demo123" }),
      });
      const data = await res.json();
      if (data.user) {
        onLogin(data.user);
        toast.success(`مرحباً ${data.user.name}`);
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.user) {
        onLogin(data.user);
        toast.success("تم تسجيل الدخول بنجاح");
      } else {
        toast.error(data.error || "بيانات الدخول غير صحيحة");
      }
    } catch {
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="min-h-screen relative overflow-hidden fingerprint-bg flex flex-col items-center justify-center p-6">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-primary/10"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ y: [0, -80, 0], opacity: [0, 0.5, 0] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full border border-primary/8"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full border border-accent/8"
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <AnimatePresence>
        {mounted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="w-full max-w-sm relative z-10"
          >
            {/* الشعار */}
            <motion.div
              className="flex flex-col items-center mb-10"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="relative">
                <motion.div
                  className="w-24 h-24 rounded-2xl seal-gold flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Scale className="w-12 h-12 text-white" strokeWidth={1.5} />
                </motion.div>
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-primary/25"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <h1 className="text-3xl font-bold text-foreground mt-2 tracking-tight">ميزان العدالة</h1>
              <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                منصة المحامين الذكية
                <Sparkles className="w-3 h-3 text-primary" />
              </p>
            </motion.div>

            {/* البطاقة الزجاجية */}
            <motion.div
              className="glass-legal rounded-3xl p-6 space-y-5"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground mr-1">البريد الإلكتروني</label>
                  <div className="relative group">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@lawfirm.com"
                      className="w-full h-12 pr-10 pl-4 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/25 focus:bg-background transition-all outline-none"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground mr-1">كلمة المرور</label>
                  <div className="relative group">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 pr-10 pl-10 rounded-xl bg-secondary/50 border-0 text-sm focus:ring-2 focus:ring-primary/25 focus:bg-background transition-all outline-none"
                      dir="rtl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl seal-gold text-white font-semibold text-sm relative overflow-hidden group disabled:opacity-70"
                  whileTap={{ scale: 0.96 }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "تسجيل الدخول"}
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  />
                </motion.button>
              </form>

              <div className="relative">
                <div className="gold-divider" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-[10px] text-muted-foreground">أو</span>
              </div>

              <motion.button
                onClick={handleAutoLogin}
                className="w-full h-10 rounded-xl border border-primary/20 text-primary text-xs font-medium hover:bg-primary/5 transition-colors"
                whileTap={{ scale: 0.96 }}
              >
                الدخول كزائر
              </motion.button>
            </motion.div>

            <motion.p
              className="text-center text-[10px] text-muted-foreground/50 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              ميزان العدالة © 2026 — جميع الحقوق محفوظة
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
