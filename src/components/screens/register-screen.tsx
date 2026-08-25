"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { toast } from "react-hot-toast";

interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  role?: string;
}

export function RegisterScreen({ onRegistered }: { onRegistered: (u: RegisteredUser) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "تعذّر إنشاء الحساب");
        return;
      }
      toast.success("تم إنشاء حسابك، جارٍ الدخول...");
      // Auto-login after registration.
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.success) {
        onRegistered(loginData.user);
      } else {
        toast.success("تم إنشاء الحساب، سجّل دخولك الآن");
      }
    } catch {
      toast.error("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 bg-background">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-400/25 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-24 w-72 h-72 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-7">
          <div className="w-20 h-20 mx-auto rounded-3xl brand-emerald flex items-center justify-center shadow-2xl shadow-primary/40 mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">أنشئ حسابك</h1>
          <p className="text-sm text-muted-foreground mt-1">ابدأ بخطة مجانية دائمة خلال ثوانٍ</p>
        </div>

        <form onSubmit={submit} className="legal-card rounded-3xl p-6 space-y-4">
          <Field icon={<User className="w-4 h-4" />} label="الاسم الكامل" value={name} onChange={setName} />
          <Field
            icon={<Mail className="w-4 h-4" />}
            type="email"
            label="البريد الإلكتروني"
            value={email}
            onChange={setEmail}
            dir="ltr"
          />
          <Field
            icon={<Lock className="w-4 h-4" />}
            type={showPassword ? "text" : "password"}
            label="كلمة المرور (8 أحرف على الأقل)"
            value={password}
            onChange={setPassword}
            dir="ltr"
            trailing={
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl brand-emerald text-white font-bold text-sm disabled:opacity-70 shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإنشاء...</> : "إنشاء الحساب مجاناً"}
          </button>

          <p className="text-center text-xs text-muted-foreground pt-1">
            بإنشائك حساباً فأنت توافق على شروط الاستخدام وسياسة الخصوصية
          </p>
        </form>
      </motion.div>
    </div>
  );
}

function Field({
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
        required
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent pl-10 pr-10 pt-5 pb-2 text-sm outline-none"
        placeholder=" "
      />
      <label className={`absolute right-10 transition-all pointer-events-none ${active ? "top-1.5 text-[10px] text-primary" : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"}`}>
        {label}
      </label>
      {trailing && <span className="absolute left-3 top-1/2 -translate-y-1/2">{trailing}</span>}
    </div>
  );
}
