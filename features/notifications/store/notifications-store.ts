"use client";

import { create } from "zustand";
import {
  sortAnnouncementsForInbox,
  type AnnouncementWithRead,
} from "@/lib/supabase/queries/announcements";

interface NotificationsState {
  items: AnnouncementWithRead[];
  loading: boolean;
  panelOpen: boolean;
  setItems: (items: AnnouncementWithRead[]) => void;
  upsertItem: (item: AnnouncementWithRead) => void;
  setLoading: (loading: boolean) => void;
  setPanelOpen: (open: boolean) => void;
  markReadLocal: (announcementIds: string[]) => void;
  markUnreadLocal: (announcementId: string) => void;
  dismissLocal: (announcementId: string) => void;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>()((set) => ({
  items: [],
  loading: false,
  panelOpen: false,
  setItems: (items) => set({ items: sortAnnouncementsForInbox(items) }),
  upsertItem: (item) =>
    set((state) => {
      const existingIndex = state.items.findIndex((entry) => entry.id === item.id);
      if (existingIndex >= 0) {
        const next = [...state.items];
        next[existingIndex] = item;
        return { items: sortAnnouncementsForInbox(next) };
      }

      return {
        items: sortAnnouncementsForInbox([item, ...state.items]),
      };
    }),
  setLoading: (loading) => set({ loading }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  markReadLocal: (announcementIds) =>
    set((state) => {
      if (announcementIds.length === 0) {
        return state;
      }

      const idSet = new Set(announcementIds);
      const readAt = new Date().toISOString();

      return {
        items: state.items.map((item) =>
          idSet.has(item.id) && !item.readAt ? { ...item, readAt } : item,
        ),
      };
    }),
  markUnreadLocal: (announcementId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === announcementId ? { ...item, readAt: null } : item,
      ),
    })),
  dismissLocal: (announcementId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== announcementId),
    })),
  reset: () => set({ items: [], loading: false, panelOpen: false }),
}));

export function getUnreadNotificationCount(items: AnnouncementWithRead[]): number {
  return items.filter((item) => !item.readAt).length;
}
