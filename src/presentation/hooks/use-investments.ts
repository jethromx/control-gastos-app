'use client';
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getInvestmentUseCases } from '../lib/di';
import { queryKeys } from '../lib/query-keys';

// After any mutation, pages call refresh() on their specific hook. We also
// invalidate the dashboard so navigating back always shows fresh data.
function useCrossInvalidate(userId: string | undefined) {
  const qc = useQueryClient();
  return useCallback(
    (ownKey: readonly string[]) => {
      qc.invalidateQueries({ queryKey: ownKey });
      if (userId) qc.invalidateQueries({ queryKey: queryKeys.dashboard(userId) });
    },
    [qc, userId]
  );
}

// ── dashboard ────────────────────────────────────────────────────
export function useDashboard(userId: string | undefined) {
  const { data = null, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard(userId ?? ''),
    queryFn:  () => getInvestmentUseCases().getDashboardSummary(userId!),
    enabled:  !!userId,
  });
  return { data, loading: isLoading, error: error?.message ?? null, refresh: refetch };
}

// ── briqs ────────────────────────────────────────────────────────
export function useBriqs(userId: string | undefined) {
  const invalidate = useCrossInvalidate(userId);
  const key = queryKeys.briqs(userId ?? '');
  const { data: briqs = [], isLoading } = useQuery({
    queryKey: key,
    queryFn:  () => getInvestmentUseCases().getAllBriqsForUser(userId!),
    enabled:  !!userId,
  });
  const refresh = useCallback(() => invalidate(key), [invalidate, key]);
  return { briqs, loading: isLoading, refresh };
}

// ── funds ────────────────────────────────────────────────────────
export function useFunds(userId: string | undefined) {
  const invalidate = useCrossInvalidate(userId);
  const key = queryKeys.funds(userId ?? '');
  const { data: funds = [], isLoading } = useQuery({
    queryKey: key,
    queryFn:  () => getInvestmentUseCases().getAllFundsForUser(userId!),
    enabled:  !!userId,
  });
  const refresh = useCallback(() => invalidate(key), [invalidate, key]);
  return { funds, loading: isLoading, refresh };
}

// ── lands ────────────────────────────────────────────────────────
export function useLands(userId: string | undefined) {
  const invalidate = useCrossInvalidate(userId);
  const key = queryKeys.lands(userId ?? '');
  const { data: lands = [], isLoading } = useQuery({
    queryKey: key,
    queryFn:  () => getInvestmentUseCases().getAllLandsForUser(userId!),
    enabled:  !!userId,
  });
  const refresh = useCallback(() => invalidate(key), [invalidate, key]);
  return { lands, loading: isLoading, refresh };
}

// ── afores ───────────────────────────────────────────────────────
export function useAfores(userId: string | undefined) {
  const invalidate = useCrossInvalidate(userId);
  const key = queryKeys.afores(userId ?? '');
  const { data: afores = [], isLoading } = useQuery({
    queryKey: key,
    queryFn:  () => getInvestmentUseCases().getAllAforesForUser(userId!),
    enabled:  !!userId,
  });
  const refresh = useCallback(() => invalidate(key), [invalidate, key]);
  return { afores, loading: isLoading, refresh };
}
