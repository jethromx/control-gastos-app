'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { getInvestmentUseCases } from '../../lib/di';

interface CustomFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomForm({ userId, onSuccess, onCancel }: CustomFormProps) {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    setSaving(true);
    const uc = getInvestmentUseCases();
    const description = JSON.stringify({ amount: parseFloat(form.amount), date: form.date, notes: form.notes });
    await uc.createInvestment({
      userId,
      name: form.name,
      description,
      type: 'custom',
      status: 'active',
    });
    setSaving(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label>Nombre <span className="text-red-500">*</span></Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Ej. Préstamo familiar"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label>Monto (MXN) <span className="text-red-500">*</span></Label>
        <Input
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
          placeholder="50000"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label>Fecha</Label>
        <Input
          type="date"
          value={form.date}
          onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
        />
      </div>
      <div className="grid gap-2">
        <Label>Notas (opcional)</Label>
        <Input
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Descripción libre..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving || !form.name || !form.amount}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
