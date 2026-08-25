"use client";

import { useEffect, useState, Suspense } from "react";
import { useAppStore } from "@/lib/store";
import { Toaster } from "react-hot-toast";
import { AppShell } from "@/components/layout/app-shell";
import { PageTransition } from "@/components/ui/page-transition";
import { LoginScreen } from "@/components/screens/login-screen";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { CasesScreen } from "@/components/screens/cases-screen";
import { CaseDetailsScreen } from "@/components/screens/case-details-screen";
import { ClientsScreen } from "@/components/screens/clients-screen";
import { ClientProfileScreen } from "@/components/screens/client-profile-screen";
import { AnalyticsScreen } from "@/components/screens/analytics-screen";
import { LawsScreen } from "@/components/screens/laws-screen";
import { PetitionsScreen } from "@/components/screens/petitions-screen";
import { NotesScreen } from "@/components/screens/notes-screen";
import { NoteEditorScreen } from "@/components/screens/note-editor-screen";
import { AppointmentsScreen } from "@/components/screens/appointments-screen";
import { SettingsScreen } from "@/components/screens/settings-screen";
import { DocumentsScreen } from "@/components/screens/documents-screen";
import { SubscriptionsScreen } from "@/components/screens/subscriptions-screen";
import { TransactionsScreen } from "@/components/screens/transactions-screen";
import { AdminScreen } from "@/components/screens/admin-screen";
import { TasksScreen } from "@/components/screens/tasks-screen";
import { RegisterScreen } from "@/components/screens/register-screen";
import { PWARegister } from "@/components/pwa-register";
import { LandingPage } from "@/components/landing/landing-page";

function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-lg font-bold mb-2">حدث خطأ غير متوقع</h2>
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 rounded-xl brand-emerald text-white text-sm font-medium">
        إعادة المحاولة
      </button>
    </div>
  );
}

function ScreenLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

type PublicPlan = {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

export default function Home() {
  const { currentScreen, darkMode, setDarkMode, navigate } = useAppStore();
  const [user, setUser] = useState<{ id: string; name: string; email: string; isAdmin: boolean; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [plans, setPlans] = useState<PublicPlan[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved) setDarkMode(saved === "true");

    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.id) {
          setUser(data);
          navigate("dashboard");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load public pricing for the landing page (no auth required).
    fetch("/api/subscriptions/plans")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.plans ?? [];
        setPlans(list);
      })
      .catch(() => {});
  }, [setDarkMode, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const renderScreen = () => {
    if (error) return <ErrorFallback error={error} reset={() => setError(null)} />;
    try {
      switch (currentScreen) {
        case "login":
          return <LoginScreen onLogin={(u) => { setUser(u); navigate("dashboard"); }} />;
        case "register":
          return <RegisterScreen onRegistered={(u) => { setUser(u); navigate("dashboard"); }} />;
        case "dashboard": return <DashboardScreen />;
        case "cases": return <CasesScreen />;
        case "case-details": return <CaseDetailsScreen />;
        case "clients": return <ClientsScreen />;
        case "client-profile": return <ClientProfileScreen />;
        case "analytics": return <AnalyticsScreen />;
        case "laws": return <LawsScreen />;
        case "petitions": return <PetitionsScreen />;
        case "notes": return <NotesScreen />;
        case "note-editor": return <NoteEditorScreen />;
        case "appointments": return <AppointmentsScreen />;
        case "settings": return <SettingsScreen />;
        case "documents": return <DocumentsScreen />;
        case "subscriptions":
          return <SubscriptionsScreen />;
        case "transactions": return <TransactionsScreen />;
        case "tasks": return <TasksScreen />;
        case "admin": return <AdminScreen />;
        default: return <DashboardScreen />;
      }
    } catch (e) {
      setError(e as Error);
      return <ErrorFallback error={e as Error} reset={() => setError(null)} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl brand-emerald flex items-center justify-center animate-pulse shadow-lg shadow-primary/30">
            <span className="text-2xl text-white font-bold">⚖️</span>
          </div>
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated visitors see the public marketing/landing page, unless they
  // explicitly requested #login or #register — then show the auth screen.
  if (!user) {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash === "#login" || hash === "#register") {
      const goDashboard = (u: { id: string; name: string; email: string; isAdmin: boolean; role?: string }) => {
        setUser(u);
        if (typeof window !== "undefined") window.location.hash = "";
        navigate("dashboard");
      };
      return (
        <div className="min-h-screen bg-background text-foreground">
          <Toaster position="top-center" />
          {hash === "#register" ? (
            <RegisterScreen onRegistered={goDashboard} />
          ) : (
            <LoginScreen onLogin={goDashboard} />
          )}
        </div>
      );
    }
    return <LandingPage plans={plans} />;
  }

  const isLogin = currentScreen === "login";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PWARegister />
      <a href="#main-content" className="skip-link">تخطي إلى المحتوى الرئيسي</a>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "16px",
            background: darkMode ? "#0f1a17" : "#fff",
            color: darkMode ? "#fff" : "#000",
            border: `1px solid ${darkMode ? "#1f3a32" : "#e5e7eb"}`,
          },
        }}
      />
      <AppShell user={user} showChrome={!isLogin}>
        <main id="main-content">
          <Suspense fallback={<ScreenLoader />}>
            <PageTransition>{renderScreen()}</PageTransition>
          </Suspense>
        </main>
      </AppShell>
    </div>
  );
}
