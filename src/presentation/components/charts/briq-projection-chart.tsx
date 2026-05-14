'use client';
import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BriqInvestmentWithDetails } from '../../../domain/entities/investment.entity';

interface Props {
  briqs: BriqInvestmentWithDetails[];
  months?: number;
}

function addMonths(date: Date, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

export function BriqProjectionChart({ briqs, months = 12 }: Props) {
  const chartData = useMemo(() => {
    const active = briqs.filter((b) => b.status !== 'completed');
    if (active.length === 0) return [];

    const now = new Date();
    const points = Array.from({ length: months }, (_, i) => {
      const date = addMonths(now, i);
      const label = date.toLocaleString('es-MX', { month: 'short', year: '2-digit' });

      let interest = 0;
      let capital = 0;

      for (const b of active) {
        // Skip if investment expires before this month
        if (b.briq.termMonths) {
          const expiry = addMonths(new Date(b.briq.investmentDate), b.briq.termMonths);
          if (date > expiry) continue;
        }
        interest += b.monthlyInterest;
        capital += b.briq.investedAmount;
      }

      return {
        month: label,
        'Interés mensual': Math.round(interest),
        'Capital activo': Math.round(capital),
      };
    });

    // Add cumulative interest line
    let cumulative = 0;
    return points.map((p) => {
      cumulative += p['Interés mensual'];
      return { ...p, 'Acumulado': cumulative };
    });
  }, [briqs, months]);

  if (chartData.length === 0) return null;

  const fmt = (v: number) => v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `$${(v / 1_000).toFixed(0)}k`
    : `$${v}`;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tickFormatter={fmt} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={fmt} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString('es-MX')}`, '']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,.07)' }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        <Bar yAxisId="left" dataKey="Interés mensual" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.85} />
        <Line yAxisId="right" type="monotone" dataKey="Acumulado" stroke="#10b981" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
