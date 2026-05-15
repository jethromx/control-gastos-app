'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '../../infrastructure/supabase/client';
import { queryKeys } from '../lib/query-keys';

export type FeatureFlags = Record<string, boolean>;

async function fetchFeatureFlags(): Promise<FeatureFlags> {
  const supabase = createClient();
  const { data } = await supabase.from('feature_flags').select('key, enabled');
  return Object.fromEntries(
    (data ?? []).map((r: { key: string; enabled: boolean }) => [r.key, r.enabled])
  );
}

export function useFeatureFlags() {
  const { data: flags = {}, isLoading } = useQuery({
    queryKey: queryKeys.featureFlags(),
    queryFn:  fetchFeatureFlags,
    staleTime: 10 * 60 * 1000, // feature flags rarely change — 10 min TTL
    gcTime:    20 * 60 * 1000,
  });

  const isEnabled = (key: string) => flags[key] !== false; // default true if unknown

  return { flags, loading: isLoading, isEnabled };
}

export async function setFeatureFlag(key: string, enabled: boolean): Promise<void> {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('feature_flags') as any).update({ enabled }).eq('key', key);
}

// Call this after setFeatureFlag to push the change to all consumers instantly.
export function useInvalidateFeatureFlags() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.featureFlags() });
}
