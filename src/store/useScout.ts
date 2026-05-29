import { useEffect, useState, useCallback } from "react";

const SAVED_KEY = "csny.saved";
const CALC_KEY = "csny.calc";

type CalcItem = { providerId: string; classes: number };

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

// Lightweight pub-sub so multiple components stay in sync
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function useSaved() {
  const [saved, setSaved] = useState<string[]>(() => read<string[]>(SAVED_KEY, []));

  useEffect(() => {
    const l = () => setSaved(read<string[]>(SAVED_KEY, []));
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = read<string[]>(SAVED_KEY, []);
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    notify();
  }, []);

  const isSaved = useCallback((id: string) => saved.includes(id), [saved]);

  return { saved, toggle, isSaved };
}

export function useCalculator() {
  const [items, setItems] = useState<CalcItem[]>(() => read<CalcItem[]>(CALC_KEY, []));

  useEffect(() => {
    const l = () => setItems(read<CalcItem[]>(CALC_KEY, []));
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const persist = (next: CalcItem[]) => {
    localStorage.setItem(CALC_KEY, JSON.stringify(next));
    notify();
  };

  const add = useCallback((providerId: string) => {
    const current = read<CalcItem[]>(CALC_KEY, []);
    if (current.some((i) => i.providerId === providerId)) {
      persist(current.map((i) => (i.providerId === providerId ? { ...i, classes: i.classes + 1 } : i)));
    } else {
      persist([...current, { providerId, classes: 4 }]);
    }
  }, []);

  const remove = useCallback((providerId: string) => {
    const current = read<CalcItem[]>(CALC_KEY, []);
    persist(current.filter((i) => i.providerId !== providerId));
  }, []);

  const setClasses = useCallback((providerId: string, classes: number) => {
    const current = read<CalcItem[]>(CALC_KEY, []);
    persist(current.map((i) => (i.providerId === providerId ? { ...i, classes: Math.max(1, classes) } : i)));
  }, []);

  const clear = useCallback(() => persist([]), []);

  return { items, add, remove, setClasses, clear };
}
