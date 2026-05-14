'use client';
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BriqInvestmentWithDetails, FundInvestmentWithDetails, LandInvestmentWithDetails } from '../../../domain/entities/investment.entity';

interface Props {
  briqs: BriqInvestmentWithDetails[];
  funds: FundInvestmentWithDetails[];
  lands: LandInvestmentWithDetails[];
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function labelFromKey(key: string) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('es-MX', { month: 'short', year: '2-digit' });
}

export function PortfolioGrowthChart({ briqs, funds, lands }: Props) {
  const chartData = useMemo(() => {
    // Collect all events with type and amount
    const events: { month: string; briq: number; fondos: number; terrenos: number }[] = [];
    const byMonth: Record<string, { briq: number; fondos: number; terrenos: number }> = {};

    function ensure(key: string) {
      if (!byMonth[key]) byMonth[key] = { briq: 0, fondos: 0, terrenos: 0 };
    }

    // Briq investments
    for (const b of briqs) {
      const key = monthKey(new Date(b.briq.investmentDate));
      ensure(key);
      byMonth[key].briq += b.briq.investedAmount;
    }

    // Fund transactions
    for (const f of funds) {
      for (const t of f.transactions) {
        const key = monthKey(new Date(t.transactionDate));
        ensure(key);
        byMonth[key].fondos += t.totalAmount;
      }
    }

    // Land payments (installments only)
    for (const l of lands) {
      for (const p of l.payments) {
        if (p.paymentType === 'expense') continue;
        const key = monthKey(new Date(p.paymentDate));
        ensure(key);
        byMonth[key].terrenos += p.amount;
      }
    }

    if (Object.keys(byMonth).length === 0) return [];

    // Sort months and compute cumulative totals
    const sorted = Object.keys(byMonth).sort();
    let cumBriq = 0, cumFondos = 0, cumTerrenos = 0;

    return sorted.map((key) => {
      cumBriq += byMonth[key].briq;
      cumFondos += byMonth[key].fondos;
      cumTerrenos += byMonth[key].terrenos;
      return {
        month: labelFromKey(key),
        Briq: Math.round(cumBriq),
        Fondos: Math.round(cumFondos),
        Terrenos: Math.round(cumTerrenos),
        Total: Math.round(cumBriq + cumFondos + cumTerrenos),
      };
    });
  }, [briqs, funds, lands]);

  if (chartData.length < 2) return (
    <div className="flex items-center justify-center h-48 text-sm text-slate-400">
      Se necesitan al menos 2 meses de datos para mostrar la evolución.
    </div>
  );

  const fmt = (v: number) => v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `$${(v / 1_000).toFixed(0)}k`
    : `$${v}`;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gBriq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gFondos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gTerrenos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString('es-MX')}`, '']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,.07)' }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        <Area type="monotone" dataKey="Briq" stackId="1" stroke="#6366f1" fill="url(#gBriq)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="Fondos" stackId="1" stroke="#0ea5e9" fill="url(#gFondos)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="Terrenos" stackId="1" stroke="#10b981" fill="url(#gTerrenos)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
