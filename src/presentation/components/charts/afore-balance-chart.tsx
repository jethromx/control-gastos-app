'use client';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { AforeBalanceSnapshot } from '../../../domain/entities/investment.entity';

interface Props {
  snapshots: AforeBalanceSnapshot[];
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v);
}

function fmtDate(d: Date | string) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
}

export function AforeBalanceChart({ snapshots }: Props) {
  if (snapshots.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        Agrega al menos 2 registros de saldo para ver la gráfica
      </div>
    );
  }

  const data = [...snapshots]
    .sort((a, b) => a.snapshotDate.getTime() - b.snapshotDate.getTime())
    .map((s) => ({
      fecha: fmtDate(s.snapshotDate),
      retiro: s.balanceRetiro,
      vivienda: s.balanceVivienda,
      total: s.balanceTotal,
    }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip
          formatter={(value) => [fmtCurrency(value as number), '']}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line dataKey="retiro" name="Retiro (RCV)" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
        <Line dataKey="vivienda" name="Vivienda" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
        <Line dataKey="total" name="Total" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} strokeDasharray="5 3" />
      </LineChart>
    </ResponsiveContainer>
  );
}
