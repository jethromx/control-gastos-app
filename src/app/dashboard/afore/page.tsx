'use client';
import { useState } from 'react';
import { Plus, Trash2, TrendingUp, Wallet, BarChart3, PiggyBank, Home, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui/card';
import { Button } from '../../../presentation/components/ui/button';
import { Badge } from '../../../presentation/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../presentation/components/ui/dialog';
import { ConfirmDialog } from '../../../presentation/components/ui/confirm-dialog';
import { InvestmentCardSkeleton } from '../../../presentation/components/ui/investment-card-skeleton';
import { AforeForm } from '../../../presentation/components/investments/afore-form';
import { AforeMovementForm } from '../../../presentation/components/investments/afore-movement-form';
import { AforeSnapshotForm } from '../../../presentation/components/investments/afore-snapshot-form';
import { AforeImportButton } from '../../../presentation/components/investments/afore-import';
import dynamic from 'next/dynamic';
const ChartSkeleton = () => <div className="h-56 animate-pulse rounded-lg bg-slate-100" />;
const AforeBalanceChart = dynamic(() => import('../../../presentation/components/charts/afore-balance-chart').then((m) => ({ default: m.AforeBalanceChart })), { ssr: false, loading: ChartSkeleton });
import { useAuth } from '../../../presentation/hooks/use-auth';
import { useAfores } from '../../../presentation/hooks/use-investments';
import { useToast } from '../../../presentation/components/ui/toast-provider';
import { formatCurrency, formatDate } from '../../../presentation/lib/utils';
import { getInvestmentUseCases } from '../../../presentation/lib/di';
import type { AforeInvestmentWithDetails, AforeMovementType } from '../../../domain/entities/investment.entity';

const MOVEMENT_LABELS: Record<AforeMovementType, string> = {
  patron:     'Patronal',
  trabajador: 'Trabajador',
  voluntario: 'Voluntaria',
  gobierno:   'Gobierno',
  retiro:     'Retiro',
};
const MOVEMENT_VARIANTS: Record<AforeMovementType, 'success' | 'default' | 'secondary' | 'destructive' | 'warning'> = {
  patron:     'success',
  trabajador: 'default',
  voluntario: 'warning',
  gobierno:   'secondary',
  retiro:     'destructive',
};

function AforeDetail({
  afore,
  onAddSnapshot,
  onDeleteSnapshot,
  onAddMovement,
  onDeleteMovement,
  onDelete,
  onRefresh,
}: {
  afore: AforeInvestmentWithDetails;
  onAddSnapshot: (aforeId: string) => void;
  onDeleteSnapshot: (id: string) => void;
  onAddMovement: (aforeId: string) => void;
  onDeleteMovement: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<'snapshots' | 'movements'>('snapshots');


  return (
    <div className="space-y-5">
      {/* AFORE header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{afore.name}</h2>
          <p className="text-sm text-slate-500">{afore.details.aforeName} · NSR {afore.details.nsr}%</p>
          {afore.details.accountNumber && (
            <p className="text-xs text-slate-400 mt-0.5">NSS / Cta: {afore.details.accountNumber}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500 shrink-0" onClick={() => onDelete(afore.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* 3 sub-account cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Saldo retiro</p>
                <p className="mt-1.5 text-xl font-bold text-indigo-600 tabular-nums">{formatCurrency(afore.currentBalanceRetiro)}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">RCV</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                <PiggyBank className="h-4.5 w-4.5 text-white h-[18px] w-[18px]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mi vivienda</p>
                <p className="mt-1.5 text-xl font-bold text-amber-600 tabular-nums">{formatCurrency(afore.currentBalanceVivienda)}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">INFONAVIT / FOVISSSTE</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500">
                <Home className="h-[18px] w-[18px] text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Saldo total</p>
                <p className="mt-1.5 text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(afore.currentBalance)}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Rend. anual ~{formatCurrency(afore.projectedAnnualReturn)}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
                <TrendingUp className="h-[18px] w-[18px] text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Evolución del saldo</CardTitle>
            <div className="flex gap-2">
              <AforeImportButton aforeId={afore.details.id} onImported={onRefresh} />
              <Button size="sm" variant="outline" onClick={() => onAddSnapshot(afore.details.id)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Agregar saldo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AforeBalanceChart snapshots={afore.snapshots} />
        </CardContent>
      </Card>

      {/* Tabs: snapshots / movements */}
      <div className="flex rounded-xl border border-slate-200 overflow-hidden w-fit">
        {(['snapshots', 'movements'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-medium transition-colors ${tab === t ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            {t === 'snapshots' ? `Historial de saldos (${afore.snapshots.length})` : `Movimientos (${afore.movements.length})`}
          </button>
        ))}
      </div>

      {tab === 'snapshots' ? (
        <Card>
          {afore.snapshots.length === 0 ? (
            <CardContent className="py-10 text-center text-sm text-slate-400">
              Sin registros de saldo — agrega uno o importa un CSV
            </CardContent>
          ) : (
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Fecha</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-500">Retiro (RCV)</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-500">Vivienda</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-500">Total</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-500">Notas</th>
                    <th className="px-4 py-3 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[...afore.snapshots].reverse().map((s) => (
                    <tr key={s.id} className="bg-white hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-600 text-xs">{formatDate(s.snapshotDate)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-indigo-600 font-semibold">{formatCurrency(s.balanceRetiro)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600 font-semibold">{formatCurrency(s.balanceVivienda)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-bold">{formatCurrency(s.balanceTotal)}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-[160px] truncate">{s.notes ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => onDeleteSnapshot(s.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => onAddMovement(afore.details.id)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Registrar movimiento
              </Button>
            </div>
            {afore.movements.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">Sin movimientos registrados</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Fecha</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Tipo</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Monto</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Saldo tras mov.</th>
                      <th className="px-3 py-2.5 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...afore.movements].reverse().map((m) => (
                      <tr key={m.id} className="bg-white hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-2 text-slate-500">{formatDate(m.movementDate)}</td>
                        <td className="px-3 py-2">
                          <Badge variant={MOVEMENT_VARIANTS[m.movementType]} className="text-[10px]">
                            {MOVEMENT_LABELS[m.movementType]}
                          </Badge>
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums font-semibold ${m.movementType === 'retiro' ? 'text-rose-600' : 'text-slate-800'}`}>
                          {m.movementType === 'retiro' ? '-' : '+'}{formatCurrency(m.amount)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                          {m.balanceAfter != null ? formatCurrency(m.balanceAfter) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => onDeleteMovement(m.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AforePage() {
  const { userId } = useAuth();
  const { afores, loading, refresh } = useAfores(userId);
  const { toast } = useToast();
  const [newOpen, setNewOpen] = useState(false);
  const [snapshotTarget, setSnapshotTarget] = useState<string | null>(null);
  const [movementTarget, setMovementTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'afore' | 'movement' | 'snapshot'; id: string } | null>(null);

  const totalBalance = afores.reduce((s, a) => s + a.currentBalance, 0);
  const totalRetiro = afores.reduce((s, a) => s + a.currentBalanceRetiro, 0);
  const totalVivienda = afores.reduce((s, a) => s + a.currentBalanceVivienda, 0);
  const totalMonthly = afores.reduce((s, a) => s + a.projectedMonthlyReturn, 0);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const uc = getInvestmentUseCases();
    if (deleteTarget.type === 'afore') {
      await uc.deleteInvestment(deleteTarget.id);
      toast('AFORE eliminada');
    } else if (deleteTarget.type === 'movement') {
      await uc.deleteAforeMovement(deleteTarget.id);
      toast('Movimiento eliminado');
    } else {
      await uc.deleteAforeSnapshot(deleteTarget.id);
      toast('Registro eliminado');
    }
    setDeleteTarget(null);
    refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AFORE</h1>
          <p className="text-slate-500">Administradora de Fondos para el Retiro</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nueva AFORE</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar AFORE</DialogTitle></DialogHeader>
            {userId && (
              <AforeForm
                userId={userId}
                onSuccess={() => { setNewOpen(false); refresh(); toast('AFORE registrada'); }}
                onCancel={() => setNewOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Global summary cards — only if data exists */}
      {afores.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Saldo retiro</p>
              <p className="mt-1.5 text-lg font-bold text-indigo-600 tabular-nums">{formatCurrency(totalRetiro)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mi vivienda</p>
              <p className="mt-1.5 text-lg font-bold text-amber-600 tabular-nums">{formatCurrency(totalVivienda)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</p>
              <p className="mt-1.5 text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(totalBalance)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5 text-violet-500" />
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Rend. mensual</p>
              </div>
              <p className="mt-1.5 text-lg font-bold text-violet-600 tabular-nums">{formatCurrency(totalMonthly)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <InvestmentCardSkeleton />
          <InvestmentCardSkeleton />
        </div>
      ) : afores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-600">Sin AFORE registrada</h3>
            <p className="text-sm text-slate-400 mt-1 mb-4">Registra tu cuenta AFORE para dar seguimiento a tu retiro</p>
            <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-2" />Registrar AFORE</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {afores.map((afore) => (
            <AforeDetail
              key={afore.id}
              afore={afore}
              onAddSnapshot={(id) => setSnapshotTarget(id)}
              onDeleteSnapshot={(id) => setDeleteTarget({ type: 'snapshot', id })}
              onAddMovement={(id) => setMovementTarget(id)}
              onDeleteMovement={(id) => setDeleteTarget({ type: 'movement', id })}
              onDelete={(id) => setDeleteTarget({ type: 'afore', id })}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {/* Add snapshot dialog */}
      <Dialog open={!!snapshotTarget} onOpenChange={(o) => { if (!o) setSnapshotTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Agregar saldo</DialogTitle></DialogHeader>
          {snapshotTarget && (
            <AforeSnapshotForm
              aforeId={snapshotTarget}
              onSuccess={() => { setSnapshotTarget(null); refresh(); toast('Saldo registrado'); }}
              onCancel={() => setSnapshotTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add movement dialog */}
      <Dialog open={!!movementTarget} onOpenChange={(o) => { if (!o) setMovementTarget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar movimiento</DialogTitle></DialogHeader>
          {movementTarget && (
            <AforeMovementForm
              aforeId={movementTarget}
              onSuccess={() => { setMovementTarget(null); refresh(); toast('Movimiento registrado'); }}
              onCancel={() => setMovementTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={
          deleteTarget?.type === 'afore' ? '¿Eliminar AFORE?' :
          deleteTarget?.type === 'snapshot' ? '¿Eliminar registro de saldo?' :
          '¿Eliminar movimiento?'
        }
        description={
          deleteTarget?.type === 'afore'
            ? 'Se eliminará la cuenta AFORE y todos sus registros. Esta acción no se puede deshacer.'
            : 'El registro será eliminado permanentemente.'
        }
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
