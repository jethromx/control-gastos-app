'use client';
import { useState, useEffect, useCallback } from 'react';
import { getInvestmentUseCases } from '../lib/di';
import type {
  BriqInvestmentWithDetails,
  FundInvestmentWithDetails,
  LandInvestmentWithDetails,
} from '../../domain/entities/investment.entity';

export function useDashboard(userId: string | undefined) {
  const [data, setData] = useState<Awaited<ReturnType<ReturnType<typeof getInvestmentUseCases>['getDashboardSummary']>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const uc = getInvestmentUseCases();
      const result = await uc.getDashboardSummary(userId);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}

export function useBriqs(userId: string | undefined) {
  const [briqs, setBriqs] = useState<BriqInvestmentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const uc = getInvestmentUseCases();
      setBriqs(await uc.getAllBriqsForUser(userId));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);
  return { briqs, loading, refresh: load };
}

export function useFunds(userId: string | undefined) {
  const [funds, setFunds] = useState<FundInvestmentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const uc = getInvestmentUseCases();
      setFunds(await uc.getAllFundsForUser(userId));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);
  return { funds, loading, refresh: load };
}

export function useLands(userId: string | undefined) {
  const [lands, setLands] = useState<LandInvestmentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const uc = getInvestmentUseCases();
      setLands(await uc.getAllLandsForUser(userId));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);
  return { lands, loading, refresh: load };
}
