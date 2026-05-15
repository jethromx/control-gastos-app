'use client';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { getInvestmentUseCases } from '../../lib/di';

const AFORE_COMPANIES = [
  'SURA', 'Citibanamex', 'Profuturo', 'XXI Banorte', 'Principal',
  'Coppel', 'Invercap', 'Azteca', 'Inbursa', 'PensionISSSTE', 'Otra',
];

interface Props {
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AforeForm({ userId, onSuccess, onCancel }: Props) {
  const [name, setName] = useState('Mi AFORE');
  const [aforeName, setAforeName] = useState('');
  const [customAfore, setCustomAfore] = useState('');
  const [nsr, setNsr] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balanceRetiro, setBalanceRetiro] = useState('');
  const [balanceVivienda, setBalanceVivienda] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const resolvedAfore = aforeName === 'Otra' ? customAfore.trim() : aforeName;
    if (!resolvedAfore) { setError('Selecciona o escribe la administradora'); return; }
    if (!nsr || Number(nsr) <= 0) { setError('Ingresa un NSR válido'); return; }

    const retiro = Number(balanceRetiro) || 0;
    const vivienda = Number(balanceVivienda) || 0;
    const hasInitialBalance = retiro > 0 || vivienda > 0;

    setLoading(true);
    try {
      const uc = getInvestmentUseCases();
      await uc.createAforeInvestment(
        { userId, name: name.trim() || 'Mi AFORE', type: 'afore', status: 'active', description: '' },
        { aforeName: resolvedAfore, nsr: Number(nsr), accountNumber: accountNumber.trim() || undefined },
        hasInitialBalance ? { snapshotDate: new Date(today), balanceRetiro: retiro, balanceVivienda: vivienda, notes: 'Saldo inicial' } : undefined
      );
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
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
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi AFORE" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="aforeName">Administradora (AFORE) *</Label>
        <select
          id="aforeName"
          value={aforeName}
          onChange={(e) => setAforeName(e.target.value)}
          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
        >
          <option value="">Seleccionar...</option>
          {AFORE_COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {aforeName === 'Otra' && (
          <Input value={customAfore} onChange={(e) => setCustomAfore(e.target.value)} placeholder="Nombre de la administradora" className="mt-2" />
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nsr">NSR — Rendimiento neto anual (%) *</Label>
        <Input id="nsr" type="number" step="0.01" min="0" value={nsr} onChange={(e) => setNsr(e.target.value)} placeholder="Ej. 9.5" />
        <p className="text-xs text-slate-400">Consulta tu NSR en consar.gob.mx o en tu estado de cuenta</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="accountNumber">NSS / Número de cuenta (opcional)</Label>
        <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Número de Seguridad Social" />
      </div>

      {/* Initial balance */}
      <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
        <p className="text-sm font-medium text-slate-700">Saldo inicial (opcional)</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="balanceRetiro" className="text-xs">Saldo retiro (RCV)</Label>
            <Input id="balanceRetiro" type="number" step="0.01" min="0" value={balanceRetiro} onChange={(e) => setBalanceRetiro(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="balanceVivienda" className="text-xs">Mi vivienda (INFONAVIT)</Label>
            <Input id="balanceVivienda" type="number" step="0.01" min="0" value={balanceVivienda} onChange={(e) => setBalanceVivienda(e.target.value)} placeholder="0.00" />
          </div>
        </div>
        {(Number(balanceRetiro) > 0 || Number(balanceVivienda) > 0) && (
          <p className="text-xs text-indigo-600 font-medium">
            Total: ${(Number(balanceRetiro) + Number(balanceVivienda)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear AFORE'}
        </Button>
      </div>
    </form>
  );
}
