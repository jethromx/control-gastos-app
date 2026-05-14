'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { getInvestmentUseCases } from '../../lib/di';

interface FundFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FundForm({ userId, onSuccess, onCancel }: FundFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    titlesQuantity: '',
    titleCost: '',
  });

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  const totalAmount = parseFloat(form.titlesQuantity || '0') * parseFloat(form.titleCost || '0');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const uc = getInvestmentUseCases();
      await uc.createFundInvestment(
        { userId, name: form.name, description: form.description, status: 'active', type: 'fund' },
        {
          transactionDate: new Date(form.transactionDate),
          titlesQuantity: parseFloat(form.titlesQuantity),
          titleCost: parseFloat(form.titleCost),
          totalAmount,
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
        <Label>Nombre del fondo</Label>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="ej. GBM+ Deuda Corto Plazo" />
      </div>
      <div className="grid gap-2">
        <Label>Descripción (opcional)</Label>
        <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Notas" />
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Primera compra</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Fecha de compra</Label>
          <Input type="date" value={form.transactionDate} onChange={(e) => set('transactionDate', e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label>Número de títulos</Label>
          <Input type="number" step="0.0001" min="0" value={form.titlesQuantity} onChange={(e) => set('titlesQuantity', e.target.value)} required placeholder="1000" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Costo por título (MXN)</Label>
          <Input type="number" step="0.000001" min="0" value={form.titleCost} onChange={(e) => set('titleCost', e.target.value)} required placeholder="1.2345" />
        </div>
        <div className="grid gap-2">
          <Label>Total a invertir</Label>
          <Input readOnly value={totalAmount > 0 ? `$${totalAmount.toFixed(2)}` : ''} className="bg-gray-50" placeholder="Calculado automáticamente" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  );
}
