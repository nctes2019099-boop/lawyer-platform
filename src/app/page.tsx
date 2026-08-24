"use client";

import { useEffect, useState, Suspense } from "react";
import { useAppStore } from "@/lib/store";
import { Toaster } from "react-hot-toast";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/app-header";
import { SideDrawer } from "@/components/layout/side-drawer";
import { GlobalSearchDialog } from "@/components/layout/global-search-dialog";
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
import { SubscriptionScreen } from "@/components/screens/subscription-screen";
import { TransactionsScreen } from "@/components/screens/transactions-screen";
import { AdminScreen } from "@/components/screens/admin-screen";
import { TasksScreen } from "@/components/screens/tasks-screen";

function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <h2 className="text-lg font-bold mb-2">حدث خطأ غير متوقع</h2>
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl seal-gold text-white text-sm font-medium"
      >
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

export default function Home() {
  const { currentScreen, darkMode, setDarkMode, navigate } = useAppStore();
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved) setDarkMode(saved === "true");

    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setUser(data);
          // Auth is maintained via the httpOnly session cookie; no client-side user id needed.
          navigate("dashboard");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setDarkMode, navigate]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const renderScreen = () => {
    if (error) {
      return <ErrorFallback error={error} reset={() => setError(null)} />;
    }
    try {
      switch (currentScreen) {
        case "login":
          return <LoginScreen onLogin={(u) => { setUser(u); navigate("dashboard"); }} />;
        case "dashboard":
          return <DashboardScreen />;
        case "cases":
          return <CasesScreen />;
        case "case-details":
          return <CaseDetailsScreen />;
        case "clients":
          return <ClientsScreen />;
        case "client-profile":
          return <ClientProfileScreen />;
        case "analytics":
          return <AnalyticsScreen />;
        case "laws":
          return <LawsScreen />;
        case "petitions":
          return <PetitionsScreen />;
        case "notes":
          return <NotesScreen />;
        case "note-editor":
          return <NoteEditorScreen />;
        case "appointments":
          return <AppointmentsScreen />;
        case "settings":
          return <SettingsScreen />;
        case "documents":
          return <DocumentsScreen />;
        case "subscriptions":
          return <SubscriptionScreen />;
        case "transactions":
          return <TransactionsScreen />;
        case "tasks":
          return <TasksScreen />;
        case "admin":
          return <AdminScreen />;
        default:
          return <DashboardScreen />;
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
          <div className="w-12 h-12 rounded-2xl seal-gold flex items-center justify-center animate-pulse">
            <span className="text-2xl text-white font-bold">م</span>
          </div>
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="skip-link">
        تخطي إلى المحتوى الرئيسي
      </a>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "16px",
            background: darkMode ? "#1a1a1a" : "#fff",
            color: darkMode ? "#fff" : "#000",
            border: `1px solid ${darkMode ? "#333" : "#e5e5e5"}`,
          },
        }}
      />
      {currentScreen !== "login" && <AppHeader user={user} />}
      <SideDrawer user={user} />
      <GlobalSearchDialog />
      <main id="main-content" className={currentScreen === "login" ? "" : "pb-20 pt-16"}>
        <Suspense fallback={<ScreenLoader />}>
          <PageTransition>{renderScreen()}</PageTransition>
        </Suspense>
      </main>
      {currentScreen !== "login" && <BottomNav />}
    </div>
  );
}
