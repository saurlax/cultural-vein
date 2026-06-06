"use client";

import { create } from "zustand";

import type { RiverEra, ViewMode } from "@/types/domain";

interface CulturalVeinState {
  activeEra: RiverEra;
  searchTerm: string;
  selectedBookSlug: string;
  categoryFilter: "全部" | "经" | "史" | "子" | "集";
  schoolFilter: string;
  viewMode: ViewMode;
  setActiveEra: (era: RiverEra) => void;
  setSearchTerm: (value: string) => void;
  setSelectedBookSlug: (slug: string) => void;
  setCategoryFilter: (value: CulturalVeinState["categoryFilter"]) => void;
  setSchoolFilter: (value: string) => void;
  setViewMode: (value: ViewMode) => void;
  resetSelection: () => void;
}

export const useCulturalVeinStore = create<CulturalVeinState>((set) => ({
  activeEra: "宋元",
  searchTerm: "",
  selectedBookSlug: "sishu-zhangju",
  categoryFilter: "全部",
  schoolFilter: "全部",
  viewMode: "river",
  setActiveEra: (activeEra) => set({ activeEra }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSelectedBookSlug: (selectedBookSlug) =>
    set({ selectedBookSlug, viewMode: "book" }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setSchoolFilter: (schoolFilter) => set({ schoolFilter }),
  setViewMode: (viewMode) => set({ viewMode }),
  resetSelection: () => set({ viewMode: "river" }),
}));
