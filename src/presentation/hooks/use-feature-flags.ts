'use client';
import { useState, useEffect } from 'react';
import { createClient } from '../../infrastructure/supabase/client';

export type FeatureFlags = Record<string, boolean>;

let cache: FeatureFlags | null = null;
let pending: Promise<FeatureFlags> | null = null;
const listeners: Array<(flags: FeatureFlags) => void> = [];

function notify(flags: FeatureFlags) {
  cache = flags;
  listeners.forEach((fn) => fn(flags));
}

export async function fetchFeatureFlags(): Promise<FeatureFlags> {
  if (cache) return cache;
  // Deduplicate concurrent calls — all callers await the same promise.
  if (!pending) {
    pending = (async () => {
      const supabase = createClient();
      const { data } = await supabase.from('feature_flags').select('key, enabled');
      const flags = Object.fromEntries((data ?? []).map((r: { key: string; enabled: boolean }) => [r.key, r.enabled]));
      notify(flags);
      pending = null;
      return flags;
    })();
  }
  return pending;
}

export async function setFeatureFlag(key: string, enabled: boolean): Promise<void> {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('feature_flags') as any).update({ enabled }).eq('key', key);
  if (cache) notify({ ...cache, [key]: enabled });
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(cache ?? {});
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    listeners.push(setFlags);
    if (!cache) {
      fetchFeatureFlags().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return () => {
      const idx = listeners.indexOf(setFlags);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  const isEnabled = (key: string) => flags[key] !== false; // default true if unknown

  return { flags, loading, isEnabled };
}
