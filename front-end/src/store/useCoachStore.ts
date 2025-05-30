import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CoachState {
  coachId: string | null;
  isLoggedIn: boolean;
  hydrated: boolean;
  setCoachId: (id: string) => void;
  logout: () => void;
}

export const useCoachStore = create<CoachState>()(
  persist(
    (set, get) => ({
      coachId: null,
      isLoggedIn: false,
      hydrated: false,
      setCoachId: (id: string) => set({ coachId: id, isLoggedIn: true }),
      logout: () => set({ coachId: null, isLoggedIn: false }),
    }),
    {
      name: "coach-storage",
      onRehydrateStorage: () => (state) => {
        // @ts-ignore
        state?.set({ hydrated: true });
      },
    }
  )
);
