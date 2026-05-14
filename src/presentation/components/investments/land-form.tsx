'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getInvestmentUseCases } from '../../lib/di';

interface LandFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LandForm({ userId, onSuccess, onCancel }: LandFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    totalPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    paymentFrequency: 'monthly' as 'monthly' | 'biweekly' | 'custom',
    initialPayment: '',
    initialPaymentDate: new Date().toISOString().split('T')[0],
  });

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const uc = getInvestmentUseCases();
      await uc.createLandInvestment(
        { userId, name: form.name, description: form.description, status: 'active', type: 'land' },
        {
          totalPrice: parseFloat(form.totalPrice),
          purchaseDate: new Date(form.purchaseDate),
          paymentFrequency: form.paymentFrequency,
        },
        form.initialPayment
          ? {
              paymentDate: new Date(form.initialPaymentDate),
              amount: parseFloat(form.initialPayment),
              paymentType: 'initial',
              description: 'Enganche inicial',
            }
          : undefined
      );
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label>Nombre del terreno</Label>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="ej. Terreno Lote 5 - Fraccionamiento X" />
      </div>
      <div className="grid gap-2">
        <Label>Descripción (opcional)</Label>
        <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Ubicación, notas..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Precio total del terreno (MXN)</Label>
          <Input type="number" step="0.01" min="0" value={form.totalPrice} onChange={(e) => set('totalPrice', e.target.value)} required placeholder="500000" />
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
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Enganche inicial (opcional)</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Monto de enganche (MXN)</Label>
          <Input type="number" step="0.01" min="0" value={form.initialPayment} onChange={(e) => set('initialPayment', e.target.value)} placeholder="50000" />
        </div>
        <div className="grid gap-2">
          <Label>Fecha del enganche</Label>
          <Input type="date" value={form.initialPaymentDate} onChange={(e) => set('initialPaymentDate', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  );
}
