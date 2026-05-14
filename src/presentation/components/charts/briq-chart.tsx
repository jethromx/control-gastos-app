'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { BriqInvestmentWithDetails } from '../../../domain/entities/investment.entity';
import { formatCurrency } from '../../lib/utils';

interface BriqChartProps {
  briqs: BriqInvestmentWithDetails[];
  mode: 'capital' | 'interest';
}

const COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#7c3aed','#4f46e5','#818cf8'];

export function BriqChart({ briqs, mode }: BriqChartProps) {
  const active = briqs.filter((b) => b.status !== 'completed');
  if (active.length === 0) return <p className="text-sm text-gray-400 text-center py-8">Sin inversiones activas</p>;

  const data = active.map((b) => ({
    name: b.name.length > 18 ? b.name.slice(0, 16) + '…' : b.name,
    fullName: b.name,
    capital: b.briq.investedAmount,
    mensual: b.monthlyInterest,
    anual: b.annualInterest,
    tasa: b.briq.annualInterestRate,
  }));

  const key = mode === 'capital' ? 'capital' : 'anual';
  const label = mode === 'capital' ? 'Capital' : 'Interés anual';

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value, _name, props) => [
            formatCurrency(Number(value)),
            `${label} — ${props.payload.fullName}`,
          ]}
        />
        <Bar dataKey={key} radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
