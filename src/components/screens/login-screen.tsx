"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, Shield, Moon, Sun, Globe } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAppStore } from "@/lib/store";

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  role?: string;
}

export function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const { darkMode, setDarkMode, language, setLanguage } = useAppStore();
  const [email, setEmail] = useState("demo@lawyer.com");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoLogin, setAutoLogin] = useState(true);
  const [mounted, setMounted] = useState(false);
  const triedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !autoLogin || triedRef.current) return;
    triedRef.current = true;
    const t = setTimeout(() => void submit(email, password), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const submit = async (e?: React.FormEvent | string, pwd?: string) => {
    if (e && typeof e !== "string") e.preventDefault();
    const em = typeof e === "string" ? e : email;
    const pw = pwd ?? password;
    if (!em || !pw) return;
    setAutoLogin(false);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password: pw }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("مرحباً بك 👋");
        onLogin(data.user);
      } else {
        toast.error(data.error || "بيانات الدخول غير صحيحة");
      }
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 bg-background">
      <AnimatedBackground />

      {/* Top controls */}
      <div className="absolute top-4 inset-x-0 flex justify-between items-center px-4 z-20">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-10 h-10 rounded-xl glass-legal flex items-center justify-center"
          aria-label="تبديل المظهر"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
          className="h-10 px-3 rounded-xl glass-legal flex items-center gap-1.5 text-sm font-medium"
        >
          <Globe className="w-4 h-4" />
          {language === "ar" ? "EN" : "ع"}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Brand */}
        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto rounded-3xl brand-emerald flex items-center justify-center shadow-2xl shadow-primary/40 mb-4"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-extrabold tracking-tight">محامي محترف</h1>
          <p className="text-sm text-muted-foreground mt-1">نظام إدارة مكاتب المحاماة</p>
        </div>

        {/* Card */}
        <form onSubmit={submit} className="legal-card rounded-3xl p-6 space-y-4">
          <FloatingInput
            icon={<Mail className="w-4 h-4" />}
            type="email"
            label="البريد الإلكتروني"
            value={email}
            onChange={setEmail}
            dir="ltr"
          />
          <FloatingInput
            icon={<Lock className="w-4 h-4" />}
            type={showPassword ? "text" : "password"}
            label="كلمة المرور"
            value={password}
            onChange={setPassword}
            dir="ltr"
            trailing={
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <ShimmerButton loading={loading} />

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex-1 h-px bg-border" />
            تسجيل الدخول بأمان
            <span className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <OAuthButton label="Google" onClick={() => toast("قريباً — سجّل دخولك بالبريد التجريبي")} />
            <OAuthButton label="Apple" onClick={() => toast("قريباً — سجّل دخولك بالبريد التجريبي")} />
          </div>
        </form>

        {/* Demo hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 mx-auto max-w-xs text-center bg-secondary/60 rounded-2xl p-3 border border-border"
        >
          <p className="text-[11px] text-muted-foreground">
            حساب تجريبي: <span className="font-mono text-foreground" dir="ltr">demo@lawyer.com</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            كلمة المرور: <span className="font-mono text-foreground" dir="ltr">demo123</span>
          </p>
          {autoLogin && !loading && (
            <p className="text-[10px] text-primary mt-1.5 flex items-center justify-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> جارٍ الدخول التلقائي...
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

function FloatingInput({
  icon, type = "text", label, value, onChange, trailing, dir,
}: {
  icon: React.ReactNode; type?: string; label: string; value: string;
  onChange: (v: string) => void; trailing?: React.ReactNode; dir?: string;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div className={`relative rounded-xl border transition-all ${focused ? "border-primary ring-2 ring-primary/20 bg-background" : "border-border bg-secondary/40"}`}>
      <span className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>{icon}</span>
      <input
        type={type}
        value={value}
        dir={dir}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent pl-10 pr-10 pt-5 pb-2 text-sm outline-none peer"
        placeholder=" "
      />
      <label className={`absolute right-10 transition-all pointer-events-none ${active ? "top-1.5 text-[10px] text-primary" : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"}`}>
        {label}
      </label>
      {trailing && <span className="absolute left-3 top-1/2 -translate-y-1/2">{trailing}</span>}
    </div>
  );
}

function ShimmerButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="relative w-full h-12 rounded-xl brand-emerald text-white font-bold text-sm overflow-hidden disabled:opacity-80 shadow-lg shadow-primary/30"
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الدخول...</> : "تسجيل الدخول"}
      </span>
      {!loading && (
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2.5s_infinite]" />
      )}
      <style jsx>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      `}</style>
    </button>
  );
}

function OAuthButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 rounded-xl border border-border bg-card hover:bg-secondary transition-colors flex items-center justify-center gap-2 text-sm font-medium"
    >
      {label === "Google" ? <GoogleIcon /> : <AppleIcon />}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-400/25 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl"
        animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full bg-amber-300/15 blur-3xl"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          color: "hsl(var(--foreground))",
        }}
      />
    </div>
  );
}
