import { create } from 'zustand'
import type { MyProfileStore } from '../types/myProfile'

/* ============================================================
   myProfileStore — lightweight loading flags for profile actions
   (actual user data lives in authStore)
   ============================================================ */

export const useMyProfileStore = create<MyProfileStore>((set) => ({
    isUpdatingProfile: false,
    isChangingPassword: false,
    page: 1,
    limit: 10,

    setIsUpdatingProfile: (v) => set({ isUpdatingProfile: v }),
    setIsChangingPassword: (v) => set({ isChangingPassword: v }),
    setPage: (v) => set({ page: v }),
    setLimit: (v) => set({ limit: v }),
}))
