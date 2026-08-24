import { create } from "zustand";

export type ScreenName =
  | "dashboard"
  | "cases"
  | "case-details"
  | "clients"
  | "client-profile"
  | "analytics"
  | "laws"
  | "petitions"
  | "notes"
  | "note-editor"
  | "appointments"
  | "settings"
  | "documents"
  | "subscriptions"
  | "transactions"
  | "tasks"
  | "admin"
  | "login";

interface AppState {
  currentScreen: ScreenName;
  previousScreen: ScreenName | null;
  sidebarOpen: boolean;
  searchOpen: boolean;
  notificationsOpen: boolean;
  darkMode: boolean;
  language: "ar" | "en";
  selectedCaseId: string | null;
  selectedClientId: string | null;
  selectedNoteId: string | null;
  selectedAppointmentId: string | null;
  dialogOpen: string | null;
  dialogData: Record<string, unknown> | null;
  _lastSheetCloseTime: number;

  navigate: (screen: ScreenName, params?: Record<string, unknown>) => void;
  goBack: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setLanguage: (lang: "ar" | "en") => void;
  setDialogOpen: (dialog: string | null, data?: Record<string, unknown>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentScreen: "login",
  previousScreen: null,
  sidebarOpen: false,
  searchOpen: false,
  notificationsOpen: false,
  darkMode: false,
  language: "ar",
  selectedCaseId: null,
  selectedClientId: null,
  selectedNoteId: null,
  selectedAppointmentId: null,
  dialogOpen: null,
  dialogData: null,
  _lastSheetCloseTime: 0,

  navigate: (screen, params = {}) => {
    const state = get();
    set({
      previousScreen: state.currentScreen,
      currentScreen: screen,
      selectedCaseId: (params?.caseId as string) ?? state.selectedCaseId,
      selectedClientId: (params?.clientId as string) ?? state.selectedClientId,
      selectedNoteId: (params?.noteId as string) ?? state.selectedNoteId,
      selectedAppointmentId: (params?.appointmentId as string) ?? state.selectedAppointmentId,
      dialogOpen: (params?.openAdd as boolean) ? "add" : null,
      dialogData: params,
    });
  },

  goBack: () => {
    const state = get();
    if (state.previousScreen) {
      set({ currentScreen: state.previousScreen, previousScreen: null });
    }
  },

  setSidebarOpen: (open) => {
    if (!open) {
      set({ _lastSheetCloseTime: Date.now(), sidebarOpen: false });
    } else {
      set({ sidebarOpen: true });
    }
  },

  setSearchOpen: (open) => {
    if (open) {
      const lastClose = get()._lastSheetCloseTime;
      if (Date.now() - lastClose < 400) {
        setTimeout(() => set({ searchOpen: true }), 400);
        return;
      }
    }
    set({ searchOpen: open });
  },

  setNotificationsOpen: (open) => {
    if (!open) set({ _lastSheetCloseTime: Date.now() });
    set({ notificationsOpen: open });
  },

  setDarkMode: (dark) => set({ darkMode: dark }),
  setLanguage: (lang) => set({ language: lang }),
  setDialogOpen: (dialog, data) => set({ dialogOpen: dialog, dialogData: data }),
}));
