'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { getInvestmentUseCases } from '../../lib/di';
import { BriqInvestmentWithDetails } from '../../../domain/entities/investment.entity';
import { formatDateInput } from '../../lib/utils';

interface Props {
  investment: BriqInvestmentWithDetails;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BriqEditForm({ investment, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: investment.name,
    description: investment.description ?? '',
    annualInterestRate: String(investment.briq.annualInterestRate),
    investedAmount: String(investment.briq.investedAmount),
    investmentDate: formatDateInput(investment.briq.investmentDate),
    termMonths: investment.briq.termMonths ? String(investment.briq.termMonths) : '',
  });

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const uc = getInvestmentUseCases();
      await uc.updateBriqInvestment(
        investment.id,
        investment.briq.id,
        { name: form.name, description: form.description },
        {
          annualInterestRate: parseFloat(form.annualInterestRate),
          investedAmount: parseFloat(form.investedAmount),
          investmentDate: new Date(form.investmentDate),
          termMonths: form.termMonths ? parseInt(form.termMonths) : undefined,
        }
      );
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label>Nombre del proyecto</Label>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label>Descripción (opcional)</Label>
        <Input value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Monto de inversión (MXN)</Label>
          <Input type="number" step="0.01" min="0" value={form.investedAmount} onChange={(e) => set('investedAmount', e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label>Tasa de interés anual (%)</Label>
          <Input type="number" step="0.01" min="0" max="100" value={form.annualInterestRate} onChange={(e) => set('annualInterestRate', e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Fecha de inversión</Label>
          <Input type="date" value={form.investmentDate} onChange={(e) => set('investmentDate', e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label>Plazo (meses, opcional)</Label>
          <Input type="number" min="1" value={form.termMonths} onChange={(e) => set('termMonths', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</Button>
      </div>
    </form>
  );
}
