"use client";

import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { SideDrawer } from "./side-drawer";
import { NotificationsSheet } from "./notifications-sheet";
import { GlobalSearchDialog } from "./global-search-dialog";

interface AppShellProps {
  user: { id?: string; name?: string | null; email?: string | null; role?: string | null; isAdmin?: boolean } | null;
  children: React.ReactNode;
  showChrome?: boolean;
}

/**
 * الهيكل العام للتطبيق: رأس علوي ثابت + محتوى قابل للتمرير + شريط سفلي
 * ثابت، مع القائمة الجانبية ولوحة الإشعارات ونافذة البحث الشامل كطبقات.
 */
export function AppShell({ user, children, showChrome = true }: AppShellProps) {
  if (!showChrome) {
    return (
      <>
        {children}
        <GlobalSearchDialog />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AppHeader user={user} />
      <main className="flex-1 pt-[88px] pb-28">
        {children}
      </main>
      <BottomNav />
      <SideDrawer user={user} />
      <NotificationsSheet />
      <GlobalSearchDialog />
    </div>
  );
}
