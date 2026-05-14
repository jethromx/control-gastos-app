'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getInvestmentUseCases } from '../../lib/di';
import { LandInvestmentWithDetails } from '../../../domain/entities/investment.entity';
import { formatDateInput } from '../../lib/utils';

interface Props {
  investment: LandInvestmentWithDetails;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LandEditForm({ investment, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: investment.name,
    description: investment.description ?? '',
    totalPrice: String(investment.details.totalPrice),
    purchaseDate: formatDateInput(investment.details.purchaseDate),
    paymentFrequency: investment.details.paymentFrequency,
  });

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const uc = getInvestmentUseCases();
      await Promise.all([
        uc.updateInvestment(investment.id, { name: form.name, description: form.description }),
        uc.updateLandDetails(investment.details.id, {
          totalPrice: parseFloat(form.totalPrice),
          purchaseDate: new Date(form.purchaseDate),
          paymentFrequency: form.paymentFrequency as 'monthly' | 'biweekly' | 'custom',
        }),
      ]);
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label>Nombre del terreno</Label>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label>Descripción (opcional)</Label>
        <Input value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Precio total (MXN)</Label>
          <Input type="number" step="0.01" min="0" value={form.totalPrice} onChange={(e) => set('totalPrice', e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label>Fecha de compra</Label>
          <Input type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Frecuencia de pago</Label>
        <Select value={form.paymentFrequency} onValueChange={(v) => set('paymentFrequency', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensual</SelectItem>
            <SelectItem value="biweekly">Quincenal</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</Button>
      </div>
    </form>
  );
}
