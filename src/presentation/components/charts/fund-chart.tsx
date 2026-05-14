'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FundTitleValue } from '../../../domain/entities/investment.entity';
import { formatDate } from '../../lib/utils';

interface FundChartProps {
  history: FundTitleValue[];
}

export function FundChart({ history }: FundChartProps) {
  if (history.length === 0) return <p className="text-sm text-gray-400 text-center py-8">Sin historial de valores</p>;

  const data = history.map((h) => ({
    date: formatDate(h.date),
    valor: h.titleValue,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [`$${Number(v).toFixed(4)}`, 'Valor título']} />
        <Line type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
