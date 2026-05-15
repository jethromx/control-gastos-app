'use client';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { getInvestmentUseCases } from '../../lib/di';
import { formatCurrency } from '../../lib/utils';
import type { MortgageDetails } from '../../../domain/entities/investment.entity';

const BANKS = [
  'BBVA', 'Santander', 'HSBC', 'Banorte', 'Citibanamex',
  'Scotiabank', 'Infonavit', 'Fovissste', 'BanBajío', 'Otro',
];

interface CreateProps {
  mode?: 'create';
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface EditProps {
  mode: 'edit';
  investmentId: string;
  detailsId: string;
  initialValues: Pick<MortgageDetails, 'bank' | 'originalAmount' | 'interestRate' | 'termMonths' | 'startDate' | 'monthlyPayment' | 'propertyValue' | 'accountNumber'> & { name: string };
  onSuccess: () => void;
  onCancel: () => void;
}

type Props = CreateProps | EditProps;

function calcMonthlyPayment(amount: number, annualRate: number, termMonths: number): number {
  if (!amount || !annualRate || !termMonths) return 0;
  const r = annualRate / 100 / 12;
  return r === 0
    ? amount / termMonths
    : (amount * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export function MortgageForm(props: Props) {
  const isEdit = props.mode === 'edit';

  const [form, setForm] = useState(() => {
    if (isEdit && props.mode === 'edit') {
      const v = props.initialValues;
      return {
        name: v.name,
        bank: v.bank,
        originalAmount: String(v.originalAmount),
        interestRate: String(v.interestRate),
        termMonths: String(v.termMonths),
        startDate: new Date(v.startDate).toISOString().split('T')[0],
        monthlyPayment: String(v.monthlyPayment),
        propertyValue: v.propertyValue ? String(v.propertyValue) : '',
        accountNumber: v.accountNumber ?? '',
      };
    }
    return {
      name: '',
      bank: 'BBVA',
      originalAmount: '',
      interestRate: '',
      termMonths: '',
      startDate: new Date().toISOString().split('T')[0],
      monthlyPayment: '',
      propertyValue: '',
      accountNumber: '',
    };
  });

  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const amount = parseFloat(form.originalAmount);
    const rate = parseFloat(form.interestRate);
    const months = parseInt(form.termMonths);
    if (amount > 0 && rate > 0 && months > 0) {
      setForm((p) => ({ ...p, monthlyPayment: calcMonthlyPayment(amount, rate, months).toFixed(2) }));
    }
  }, [form.originalAmount, form.interestRate, form.termMonths]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const uc = getInvestmentUseCases();

    if (isEdit && props.mode === 'edit') {
      await Promise.all([
        uc.updateInvestment(props.investmentId, { name: form.name }),
        uc.updateMortgageDetails(props.detailsId, {
          bank: form.bank,
          originalAmount: parseFloat(form.originalAmount),
          interestRate: parseFloat(form.interestRate),
          termMonths: parseInt(form.termMonths),
          startDate: new Date(form.startDate + 'T12:00:00'),
          monthlyPayment: parseFloat(form.monthlyPayment),
          propertyValue: form.propertyValue ? parseFloat(form.propertyValue) : undefined,
          accountNumber: form.accountNumber || undefined,
        }),
      ]);
    } else {
      await uc.createMortgage(
        { userId: props.userId, name: form.name, type: 'mortgage', status: 'active' },
        {
          bank: form.bank,
          originalAmount: parseFloat(form.originalAmount),
          interestRate: parseFloat(form.interestRate),
          termMonths: parseInt(form.termMonths),
          startDate: new Date(form.startDate + 'T12:00:00'),
          monthlyPayment: parseFloat(form.monthlyPayment),
          propertyValue: form.propertyValue ? parseFloat(form.propertyValue) : undefined,
          accountNumber: form.accountNumber || undefined,
        },
      );
    }

    setSaving(false);
    props.onSuccess();
  }

  const preview = calcMonthlyPayment(
    parseFloat(form.originalAmount) || 0,
    parseFloat(form.interestRate) || 0,
    parseInt(form.termMonths) || 0,
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label>Nombre / Propiedad <span className="text-red-500">*</span></Label>
        <Input value={form.name} onChange={set('name')} placeholder="Casa Juriquilla" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Banco <span className="text-red-500">*</span></Label>
          <select
            value={form.bank}
            onChange={set('bank')}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {BANKS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <Label>No. cuenta (opcional)</Label>
          <Input value={form.accountNumber} onChange={set('accountNumber')} placeholder="1234567890" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Monto original del crédito <span className="text-red-500">*</span></Label>
          <Input type="number" step="0.01" value={form.originalAmount} onChange={set('originalAmount')} placeholder="1500000" required />
        </div>
        <div className="grid gap-2">
          <Label>Valor del inmueble (opcional)</Label>
          <Input type="number" step="0.01" value={form.propertyValue} onChange={set('propertyValue')} placeholder="2000000" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-2">
          <Label>Tasa anual (%) <span className="text-red-500">*</span></Label>
          <Input type="number" step="0.01" value={form.interestRate} onChange={set('interestRate')} placeholder="10.5" required />
        </div>
        <div className="grid gap-2">
          <Label>Plazo (meses) <span className="text-red-500">*</span></Label>
          <Input type="number" value={form.termMonths} onChange={set('termMonths')} placeholder="240" required />
        </div>
        <div className="grid gap-2">
          <Label>Fecha de inicio <span className="text-red-500">*</span></Label>
          <Input type="date" value={form.startDate} onChange={set('startDate')} required />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Pago mensual <span className="text-red-500">*</span></Label>
        <Input type="number" step="0.01" value={form.monthlyPayment} onChange={set('monthlyPayment')} placeholder="Auto-calculado" required />
        {preview > 0 && (
          <p className="text-xs text-slate-500">
            Calculado: <span className="font-semibold text-indigo-600">{formatCurrency(preview)}</span>/mes
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={props.onCancel}>Cancelar</Button>
        <Button
          type="submit"
          disabled={saving || !form.name || !form.originalAmount || !form.interestRate || !form.termMonths}
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear hipoteca'}
        </Button>
      </div>
    </form>
  );
}
