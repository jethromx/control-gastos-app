'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../lib/utils';

interface PortfolioChartProps {
  data: { name: string; value: number; color: string }[];
}

export function PortfolioChart({ data }: PortfolioChartProps) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) return <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={filtered} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
          {filtered.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
