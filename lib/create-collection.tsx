"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Activity, AppUser, Collection, Stats } from "./data";
import { closeCollectionAction, updateCollectionAction } from "@/app/actions/collections";

export type { AppUser } from "./data";
export type ContributionType = "fixed" | "flexible";

export type CollectionDraft = {
  name: string;
  description: string;
  organisation: string;
  image: string | null; // resized data URL, saved with the collection when published
  type: ContributionType | null;
  amount: string; // digits only (fixed amount)
  minimum: string; // digits only (flexible, optional)
  target: string; // digits only (optional)
  deadline: string; // YYYY-MM-DD (optional)
  allowAboveTarget: boolean;
  contributorFields: string[];
};

export type PublishedCollection = {
  id: string;
  url: string;
  name: string;
  status: "Active";
  publishedAt: string;
  slug: string;
};

const empty: CollectionDraft = {
  name: "", description: "", organisation: "", image: null,
  type: null, amount: "", minimum: "", target: "", deadline: "", allowAboveTarget: false,
  contributorFields: ["Full Name", "Email Address", "Phone Number"],
};

/* ------------------------------------------------------------------ */
/* Draft store: the create-collection wizard, kept in this browser      */
/* ------------------------------------------------------------------ */

type DraftCtx = {
  draft: CollectionDraft;
  update: (patch: Partial<CollectionDraft>) => void;
  reset: () => void;
  published: PublishedCollection | null;
  setPublished: (p: PublishedCollection | null) => void;
  hydrated: boolean;
};

const DraftContext = createContext<DraftCtx | null>(null);
const STORAGE_KEY = "kolekt-draft-v2";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<CollectionDraft>(empty);
  const [published, setPublished] = useState<PublishedCollection | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.draft) setDraft({ ...empty, ...saved.draft });
        if (saved?.published) setPublished(saved.published);
      }
      window.localStorage.removeItem("kolekt-prototype-v1"); // old frontend-only store
    } catch {
      // Ignore damaged or unavailable browser storage and keep the defaults.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, published }));
    } catch {
      // Storage can be unavailable or full (for example with a large cover image).
    }
  }, [draft, published, hydrated]);

  const update = useCallback((patch: Partial<CollectionDraft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const reset = useCallback(() => setDraft(empty), []);
  const value = useMemo(() => ({ draft, update, reset, published, setPublished, hydrated }), [draft, update, reset, published, hydrated]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Organiser data: loaded on the server, refreshed after every change  */
/* ------------------------------------------------------------------ */

type DataCtx = {
  user: AppUser;
  collections: Collection[];
  stats: Stats;
  activity: Activity[];
  closeCollection: (id: string) => Promise<void>;
  updateCollection: (id: string, patch: { name: string; description: string }) => Promise<string | null>;
  refresh: () => void;
};

const DataContext = createContext<DataCtx | null>(null);

export function DataProvider({
  user, collections: initial, stats, activity, children,
}: { user: AppUser; collections: Collection[]; stats: Stats; activity: Activity[]; children: React.ReactNode }) {
  const router = useRouter();
  const [collections, setCollections] = useState(initial);
  useEffect(() => setCollections(initial), [initial]);

  const refresh = useCallback(() => router.refresh(), [router]);

  const closeCollection = useCallback(async (id: string) => {
    // Optimistic: show it closed straight away, then confirm with the server.
    setCollections((p) => p.map((c) => (c.id === id ? { ...c, status: "Completed" as const, due: "Closed", note: undefined } : c)));
    const res = await closeCollectionAction(id);
    if (!res.ok) setCollections(initial);
    router.refresh();
  }, [initial, router]);

  const updateCollection = useCallback(async (id: string, patch: { name: string; description: string }) => {
    const res = await updateCollectionAction(id, patch);
    if (!res.ok) return res.error;
    setCollections((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    router.refresh();
    return null;
  }, [router]);

  const value = useMemo(
    () => ({ user, collections, stats, activity, closeCollection, updateCollection, refresh }),
    [user, collections, stats, activity, closeCollection, updateCollection, refresh],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

const noData: DataCtx = {
  user: { name: "", email: "" },
  collections: [],
  stats: { totalCollected: 0, thisWeek: 0, contributions: 0 },
  activity: [],
  closeCollection: async () => {},
  updateCollection: async () => null,
  refresh: () => {},
};

export function useApp() {
  const draft = useContext(DraftContext);
  if (!draft) throw new Error("useApp must be used inside AppProvider");
  const data = useContext(DataContext) ?? noData;
  return { ...draft, ...data };
}
export const useCreateCollection = useApp;
export const CreateCollectionProvider = AppProvider;
