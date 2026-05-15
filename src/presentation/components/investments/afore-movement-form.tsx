'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { getInvestmentUseCases } from '../../lib/di';
import type { AforeMovementType } from '../../../domain/entities/investment.entity';

const MOVEMENT_LABELS: Record<AforeMovementType, string> = {
  patron:      'Cuota patronal',
  trabajador:  'Cuota trabajador',
  voluntario:  'Aportación voluntaria',
  gobierno:    'Cuota gobierno',
  retiro:      'Retiro',
};

interface Props {
  aforeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AforeMovementForm({ aforeId, onSuccess, onCancel }: Props) {
  const [movementType, setMovementType] = useState<AforeMovementType>('voluntario');
  const [amount, setAmount] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split('T')[0]);
  const [balanceAfter, setBalanceAfter] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!amount || Number(amount) <= 0) { setError('Ingresa un monto válido'); return; }

    setLoading(true);
    try {
      const uc = getInvestmentUseCases();
      await uc.addAforeMovement(aforeId, {
        movementType,
        amount: Number(amount),
        movementDate: new Date(movementDate),
        balanceAfter: balanceAfter ? Number(balanceAfter) : undefined,
        description: description.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="space-y-1.5">
        <Label>Tipo de movimiento *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(MOVEMENT_LABELS) as AforeMovementType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setMovementType(t)}
              className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors text-left ${
                movementType === t
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {MOVEMENT_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Monto *</Label>
          <Input id="amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="movementDate">Fecha *</Label>
          <Input id="movementDate" type="date" value={movementDate} onChange={(e) => setMovementDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="balanceAfter">Saldo después del movimiento (opcional)</Label>
        <Input id="balanceAfter" type="number" step="0.01" min="0" value={balanceAfter} onChange={(e) => setBalanceAfter(e.target.value)} placeholder="Ej. 125,400.00" />
        <p className="text-xs text-slate-400">Si lo registras, se usará como base para calcular rendimientos</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej. Bimestre enero-febrero 2025" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Registrar movimiento'}
        </Button>
      </div>
    </form>
  );
}
