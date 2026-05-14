'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { LandPayment } from '../../../domain/entities/investment.entity';
import { formatCurrency, formatDate } from '../../lib/utils';

interface LandPaymentsChartProps {
  payments: LandPayment[];
  totalPrice: number;
}

export function LandPaymentsChart({ payments, totalPrice }: LandPaymentsChartProps) {
  if (payments.length === 0) return <p className="text-sm text-gray-400 text-center py-6">Sin pagos registrados</p>;

  const sorted = [...payments]
    .filter((p) => p.paymentType !== 'expense')
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());

  let cumulative = 0;
  const data = sorted.map((p) => {
    cumulative += p.amount;
    return {
      fecha: formatDate(p.paymentDate),
      pagado: cumulative,
      pago: p.amount,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name === 'pagado' ? 'Acumulado' : 'Pago']} />
        <ReferenceLine y={totalPrice} stroke="#6366f1" strokeDasharray="4 2" label={{ value: 'Total', fontSize: 10, fill: '#6366f1' }} />
        <Area type="monotone" dataKey="pagado" stroke="#10b981" fill="url(#landGrad)" strokeWidth={2} dot={{ r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
