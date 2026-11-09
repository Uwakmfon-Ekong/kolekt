"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Collection, collections as seedCollections, user as seedUser } from "./data";

export type ContributionType = "fixed" | "flexible";

export type CollectionDraft = {
  name: string;
  description: string;
  organisation: string;
  image: string | null; // local data URL preview only
  type: ContributionType | null;
  amount: string; // digits only (fixed amount)
  minimum: string; // digits only (flexible, optional)
  target: string; // digits only (flexible, optional)
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

export type AppUser = { name: string; email: string; phone?: string; photo?: string | null };

const empty: CollectionDraft = {
  name: "", description: "", organisation: "", image: null,
  type: null, amount: "", minimum: "", target: "", deadline: "", allowAboveTarget: false,
  contributorFields: ["Full Name", "Email Address", "Phone Number"],
};

type Ctx = {
  draft: CollectionDraft;
  update: (patch: Partial<CollectionDraft>) => void;
  reset: () => void;
  published: PublishedCollection | null;
  setPublished: (p: PublishedCollection | null) => void;
  collections: Collection[];
  addCollection: (c: Collection) => void;
  closeCollection: (id: string) => void;
  updateCollection: (id: string, patch: Partial<Collection>) => void;
  user: AppUser;
  setUser: (u: AppUser) => void;
  hydrated: boolean;
};

const AppContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "kolekt-prototype-v1";

/** Shared frontend-only store. Drafts and published collections persist in this browser. */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<CollectionDraft>(empty);
  const [published, setPublished] = useState<PublishedCollection | null>(null);
  const [collections, setCollections] = useState<Collection[]>(seedCollections);
  const [user, setUser] = useState<AppUser>(seedUser);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.draft) setDraft({ ...empty, ...saved.draft });
        if (Array.isArray(saved?.collections)) setCollections(saved.collections);
        if (saved?.published) setPublished(saved.published);
        if (saved?.user) setUser({ ...seedUser, ...saved.user });
      }
    } catch {
      // Ignore damaged or unavailable browser storage and keep the in-memory defaults.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, collections, published, user }));
    } catch {
      // Storage can be unavailable or full (for example, when a very large image is used).
    }
  }, [draft, collections, published, user, hydrated]);

  const update = useCallback((patch: Partial<CollectionDraft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const reset = useCallback(() => setDraft(empty), []);
  const addCollection = useCallback((c: Collection) => setCollections((p) => [c, ...p]), []);
  const closeCollection = useCallback(
    (id: string) => setCollections((p) => p.map((c) => (c.id === id ? { ...c, status: "Completed" as const, due: "Closed", note: undefined } : c))),
    []
  );
  const updateCollection = useCallback(
    (id: string, patch: Partial<Collection>) => setCollections((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    []
  );

  const value = useMemo(
    () => ({ draft, update, reset, published, setPublished, collections, addCollection, closeCollection, updateCollection, user, setUser, hydrated }),
    [draft, update, reset, published, collections, addCollection, closeCollection, updateCollection, user, hydrated]
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
export const useCreateCollection = useApp;
export const CreateCollectionProvider = AppProvider;
