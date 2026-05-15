'use client';
import { useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import { MortgageDetails, MortgagePayment } from '../../../domain/entities/investment.entity';
import { InvestmentCalculatorService } from '../../../domain/services/investment-calculator.service';
import { formatCurrency } from '../../lib/utils';

interface Props {
  details: MortgageDetails;
  payments: MortgagePayment[];
}

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function shortDate(d: Date) {
  return `${MONTHS_ES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

export function MortgageAmortizationChart({ details, payments }: Props) {
  const chartData = useMemo(() => {
    const schedule = InvestmentCalculatorService.calcAmortizationSchedule(
      details.originalAmount,
      details.interestRate,
      details.termMonths,
      details.startDate
    );

    // Map actual payments (with balance) keyed by year-month
    const actualByMonth: Record<string, number> = {};
    for (const p of payments) {
      if (p.balance != null) {
        const d = new Date(p.paymentDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        actualByMonth[key] = p.balance;
      }
    }

    // Show every 6 months to keep chart readable
    return schedule
      .filter((_, i) => i % 6 === 0 || i === schedule.length - 1)
      .map((s) => {
        const d = new Date(s.date);
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        return {
          label: shortDate(d),
          Programado: Math.round(s.balance),
          Real: actualByMonth[key] != null ? Math.round(actualByMonth[key]) : undefined,
        };
      });
  }, [details, payments]);

  const fmt = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}k` : `$${v}`;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} />
        <Tooltip
          formatter={(v, name) => [formatCurrency(Number(v)), name]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line
          type="monotone"
          dataKey="Programado"
          stroke="#c7d2fe"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Real"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#6366f1' }}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
