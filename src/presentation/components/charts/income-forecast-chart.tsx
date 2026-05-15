'use client';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { BriqInvestmentWithDetails } from '../../../domain/entities/investment.entity';
import { formatCurrency } from '../../lib/utils';

interface Props {
  briqs: BriqInvestmentWithDetails[];
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function IncomeForecastChart({ briqs }: Props) {
  const chartData = useMemo(() => {
    const active = briqs.filter((b) => b.status !== 'completed');
    const now = new Date();

    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();

      let interest = 0;
      for (const b of active) {
        const rawStart = new Date(b.briq.investmentDate);
        const investStart = new Date(rawStart.getFullYear(), rawStart.getMonth(), 1);
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        if (monthEnd < investStart) continue;

        if (b.briq.termMonths) {
          const end = new Date(investStart);
          end.setMonth(end.getMonth() + b.briq.termMonths);
          if (monthStart >= end) continue;
        }

        interest += b.monthlyInterest;
      }

      return {
        mes: i === 0 ? 'Hoy' : `${MONTHS_ES[month]} '${String(year).slice(2)}`,
        interes: Math.round(interest),
        isCurrent: i === 0,
      };
    });
  }, [briqs]);

  const hasData = chartData.some((d) => d.interes > 0);
  if (!hasData) return <p className="text-sm text-slate-400 text-center py-8">Sin inversiones activas</p>;

  const fmt = (v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(1)}k` : `$${v}`;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
        <Tooltip
          formatter={(v) => [formatCurrency(Number(v)), 'Interés proyectado']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,.07)' }}
        />
        <Bar dataKey="interes" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.isCurrent ? '#6366f1' : '#c7d2fe'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
