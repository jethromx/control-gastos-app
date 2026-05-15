'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { getInvestmentUseCases } from '../../lib/di';

interface Props {
  aforeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AforeSnapshotForm({ aforeId, onSuccess, onCancel }: Props) {
  const [snapshotDate, setSnapshotDate] = useState(new Date().toISOString().split('T')[0]);
  const [balanceRetiro, setBalanceRetiro] = useState('');
  const [balanceVivienda, setBalanceVivienda] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = (Number(balanceRetiro) || 0) + (Number(balanceVivienda) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (Number(balanceRetiro) <= 0 && Number(balanceVivienda) <= 0) {
      setError('Ingresa al menos un saldo');
      return;
    }
    setLoading(true);
    try {
      const uc = getInvestmentUseCases();
      await uc.upsertAforeSnapshot(aforeId, {
        snapshotDate: new Date(snapshotDate),
        balanceRetiro: Number(balanceRetiro) || 0,
        balanceVivienda: Number(balanceVivienda) || 0,
        notes: notes.trim() || undefined,
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
        <Label htmlFor="snapshotDate">Fecha del saldo *</Label>
        <Input id="snapshotDate" type="date" value={snapshotDate} onChange={(e) => setSnapshotDate(e.target.value)} />
        <p className="text-xs text-slate-400">Si ya existe un registro para esta fecha, será reemplazado</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="balanceRetiro">Saldo retiro (RCV)</Label>
          <Input id="balanceRetiro" type="number" step="0.01" min="0" value={balanceRetiro} onChange={(e) => setBalanceRetiro(e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="balanceVivienda">Mi vivienda (INFONAVIT)</Label>
          <Input id="balanceVivienda" type="number" step="0.01" min="0" value={balanceVivienda} onChange={(e) => setBalanceVivienda(e.target.value)} placeholder="0.00" />
        </div>
      </div>

      {total > 0 && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm text-indigo-700">Saldo total</span>
          <span className="text-base font-bold text-indigo-700 tabular-nums">
            ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. Estado de cuenta bimestral" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar saldo'}
        </Button>
      </div>
    </form>
  );
}
