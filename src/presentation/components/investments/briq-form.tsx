'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { getInvestmentUseCases } from '../../lib/di';

interface BriqFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BriqForm({ userId, onSuccess, onCancel }: BriqFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    annualInterestRate: '',
    investedAmount: '',
    investmentDate: new Date().toISOString().split('T')[0],
    termMonths: '',
  });

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const uc = getInvestmentUseCases();
      await uc.createBriqInvestment(
        { userId, name: form.name, description: form.description, status: 'active', type: 'briq' },
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
        <Label htmlFor="name">Nombre del proyecto</Label>
        <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="ej. Briq - Parque Industrial Q1 2025" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Input id="description" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Notas adicionales" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="amount">Monto de inversión (MXN)</Label>
          <Input id="amount" type="number" step="0.01" min="0" value={form.investedAmount} onChange={(e) => set('investedAmount', e.target.value)} required placeholder="50000" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rate">Tasa de interés anual (%)</Label>
          <Input id="rate" type="number" step="0.01" min="0" max="100" value={form.annualInterestRate} onChange={(e) => set('annualInterestRate', e.target.value)} required placeholder="14.5" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="date">Fecha de inversión</Label>
          <Input id="date" type="date" value={form.investmentDate} onChange={(e) => set('investmentDate', e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="term">Plazo (meses, opcional)</Label>
          <Input id="term" type="number" min="1" value={form.termMonths} onChange={(e) => set('termMonths', e.target.value)} placeholder="12" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  );
}
