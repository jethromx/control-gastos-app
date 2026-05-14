'use client';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FundInvestmentWithDetails } from '../../../domain/entities/investment.entity';

interface Props {
  funds: FundInvestmentWithDetails[];
}

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function dateKey(d: Date | string) {
  const date = new Date(d);
  return date.toISOString().split('T')[0];
}

export function FundPerformanceChart({ funds: allFunds }: Props) {
  const { chartData, fundNames } = useMemo(() => {
    const funds = allFunds.filter((f) => f.titleHistory.length >= 2);
    if (funds.length === 0) return { chartData: [], fundNames: [] };

    // Collect all unique dates across all funds
    const dateSet = new Set<string>();
    for (const f of funds) {
      for (const h of f.titleHistory) dateSet.add(dateKey(h.date));
    }
    const dates = Array.from(dateSet).sort();

    // For each fund, find initial title value (first history entry)
    const fundData = funds.map((f) => {
      const sorted = [...f.titleHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const initialValue = sorted[0].titleValue;
      // Build a map of date -> % return
      const map: Record<string, number> = {};
      for (const h of sorted) {
        map[dateKey(h.date)] = ((h.titleValue - initialValue) / initialValue) * 100;
      }
      return { name: f.name, map, initial: initialValue };
    });

    // Build chart rows: for each date, interpolate last known value for each fund
    const rows = dates.map((date) => {
      const row: Record<string, number | string> = { date: new Date(date).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }) };
      for (const fd of fundData) {
        // Walk backwards to find the last known value
        const known = dates.filter((d) => d <= date && fd.map[d] !== undefined);
        if (known.length > 0) {
          row[fd.name] = parseFloat(fd.map[known[known.length - 1]].toFixed(2));
        }
      }
      return row;
    });

    return { chartData: rows, fundNames: fundData.map((f) => f.name) };
  }, [allFunds]);

  if (chartData.length < 2) return (
    <div className="flex items-center justify-center h-48 text-sm text-slate-400">
      Registra al menos 2 valores de título para ver el rendimiento histórico.
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 2" />
        <Tooltip
          formatter={(value) => [`${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`, '']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,.07)' }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        {fundNames.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
