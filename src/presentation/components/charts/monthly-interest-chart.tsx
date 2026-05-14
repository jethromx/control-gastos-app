'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BriqInvestmentWithDetails } from '../../../domain/entities/investment.entity';
import { formatCurrency } from '../../lib/utils';

interface MonthlyInterestChartProps {
  briqs: BriqInvestmentWithDetails[];
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function MonthlyInterestChart({ briqs }: MonthlyInterestChartProps) {
  const active = briqs.filter((b) => b.status !== 'completed');
  if (active.length === 0) return <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>;

  const totalMonthly = active.reduce((s, b) => s + b.monthlyInterest, 0);

  const data = MONTHS.map((mes) => ({ mes, interes: totalMonthly }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
        <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Interés mensual']} />
        <Bar dataKey="interes" fill="#6366f1" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
