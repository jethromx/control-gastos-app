'use client';
import { useState } from 'react';
import {
  Plus, TreePine, Trash2, Pencil, Search, CheckCircle,
  Download, DollarSign, Wallet, ChevronDown, ChevronUp, MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui/card';
import { Button } from '../../../presentation/components/ui/button';
import { Badge } from '../../../presentation/components/ui/badge';
import { Input } from '../../../presentation/components/ui/input';
import { Label } from '../../../presentation/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../presentation/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../presentation/components/ui/select';
import { ConfirmDialog } from '../../../presentation/components/ui/confirm-dialog';
import { InvestmentCardSkeleton } from '../../../presentation/components/ui/investment-card-skeleton';
import { LandForm } from '../../../presentation/components/investments/land-form';
import { LandEditForm } from '../../../presentation/components/investments/land-edit-form';
import { LandPaymentsChart } from '../../../presentation/components/charts/land-payments-chart';
import { useAuth } from '../../../presentation/hooks/use-auth';
import { useLands } from '../../../presentation/hooks/use-investments';
import { useToast } from '../../../presentation/components/ui/toast-provider';
import { formatCurrency, formatDate, formatDateInput } from '../../../presentation/lib/utils';
import { downloadCsv } from '../../../presentation/lib/export';
import { getInvestmentUseCases } from '../../../presentation/lib/di';
import type { LandInvestmentWithDetails, LandPayment } from '../../../domain/entities/investment.entity';

const FREQ_LABEL: Record<string, string> = {
  monthly: 'Mensual', biweekly: 'Quincenal', custom: 'Personalizado',
};

const PAY_TYPE_LABEL: Record<string, string> = {
  initial: 'Enganche', installment: 'Mensualidad', expense: 'Gasto',
};

const PAY_TYPE_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  initial: 'default', installment: 'success', expense: 'destructive',
};

type PayForm = { date: string; amount: string; type: 'initial' | 'installment' | 'expense'; description: string };

function emptyPayForm(): PayForm {
  return { date: new Date().toISOString().split('T')[0], amount: '', type: 'installment', description: '' };
}

function LandSection({ land, onDelete, onRefresh, onComplete }: {
  land: LandInvestmentWithDetails;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onComplete: (id: string) => void;
}) {
  const [chartOpen, setChartOpen] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [editLandOpen, setEditLandOpen] = useState(false);
  const [payForm, setPayForm] = useState<PayForm>(emptyPayForm());
  const [editPayment, setEditPayment] = useState<LandPayment | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmPayId, setConfirmPayId] = useState<string | null>(null);
  const { toast } = useToast();
  const isCompleted = land.status === 'completed';

  async function savePayment() {
    setSaving(true);
    const uc = getInvestmentUseCases();
    try {
      if (editPayment) {
        await uc.updateLandPayment(editPayment.id, {
          paymentDate: new Date(payForm.date),
          amount: parseFloat(payForm.amount),
          paymentType: payForm.type,
          description: payForm.description || undefined,
        });
        toast('Pago actualizado');
      } else {
        await uc.addLandPayment(land.details.id, {
          paymentDate: new Date(payForm.date),
          amount: parseFloat(payForm.amount),
          paymentType: payForm.type,
          description: payForm.description || undefined,
        });
        toast('Pago registrado');
      }
      setPayOpen(false);
      setEditPayment(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }

  function openEdit(p: LandPayment) {
    setPayForm({ date: formatDateInput(p.paymentDate), amount: String(p.amount), type: p.paymentType as PayForm['type'], description: p.description ?? '' });
    setEditPayment(p);
    setPayOpen(true);
  }

  const sortedPayments = [...land.payments].sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());

  return (
    <div className={`space-y-4 ${isCompleted ? 'opacity-60' : ''}`}>
      {/* Section header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 mt-0.5">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{land.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary">{FREQ_LABEL[land.details.paymentFrequency]}</Badge>
              {land.completionPercent >= 100 && <Badge variant="success">Liquidado</Badge>}
              {isCompleted && <Badge variant="secondary">Completado</Badge>}
              <span className="text-xs text-slate-400">Compra: {formatDate(land.details.purchaseDate)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isCompleted && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => setEditLandOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600" title="Marcar como completado" onClick={() => onComplete(land.id)}>
                <CheckCircle className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500" onClick={() => onDelete(land.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Precio total</p>
            <p className="mt-1.5 text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(land.details.totalPrice)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pagado</p>
            <p className="mt-1.5 text-lg font-bold text-emerald-600 tabular-nums">{formatCurrency(land.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Por pagar</p>
            <p className="mt-1.5 text-lg font-bold text-amber-600 tabular-nums">{formatCurrency(land.remaining)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Gastos extra</p>
            <p className="mt-1.5 text-lg font-bold text-rose-500 tabular-nums">{formatCurrency(land.totalExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Avance del pago</p>
            <span className="text-sm font-bold text-indigo-600 tabular-nums">{land.completionPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(land.completionPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>{formatCurrency(land.totalPaid)} pagado</span>
            <span>{formatCurrency(land.details.totalPrice)} total</span>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Historial de pagos acumulado</CardTitle>
            <button
              onClick={() => setChartOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {chartOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {chartOpen ? 'Ocultar' : 'Ver gráfica'}
            </button>
          </div>
        </CardHeader>
        {chartOpen && (
          <CardContent>
            <LandPaymentsChart payments={land.payments} totalPrice={land.details.totalPrice} />
          </CardContent>
        )}
      </Card>

      {/* Payments table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              Pagos registrados
              <span className="ml-2 text-xs font-normal text-slate-400">({land.payments.length})</span>
            </CardTitle>
            {!isCompleted && (
              <Button size="sm" onClick={() => { setPayForm(emptyPayForm()); setEditPayment(null); setPayOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Registrar pago
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {land.payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <DollarSign className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">Sin pagos registrados</p>
              {!isCompleted && (
                <Button size="sm" variant="outline" className="mt-3" onClick={() => { setPayForm(emptyPayForm()); setPayOpen(true); }}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Primer pago
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-left font-semibold text-slate-500">Fecha</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-500">Tipo</th>
                    <th className="px-5 py-3 text-left font-semibold text-slate-500">Descripción</th>
                    <th className="px-5 py-3 text-right font-semibold text-slate-500">Monto</th>
                    <th className="px-5 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sortedPayments.map((p) => (
                    <tr key={p.id} className="bg-white hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={PAY_TYPE_VARIANT[p.paymentType]} className="text-[10px]">
                          {PAY_TYPE_LABEL[p.paymentType]}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs max-w-[220px] truncate">
                        {p.description || <span className="text-slate-300">—</span>}
                      </td>
                      <td className={`px-5 py-3 text-right tabular-nums font-semibold whitespace-nowrap ${p.paymentType === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setConfirmPayId(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-100 bg-slate-50/80">
                    <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-slate-500">Total pagado (sin gastos)</td>
                    <td className="px-5 py-3 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(land.totalPaid)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment form dialog */}
      <Dialog open={payOpen} onOpenChange={(o) => { if (!o) { setPayOpen(false); setEditPayment(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editPayment ? 'Editar pago' : 'Registrar pago'} — {land.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo de pago</Label>
              <Select value={payForm.type} onValueChange={(v) => setPayForm((p) => ({ ...p, type: v as PayForm['type'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial">Enganche</SelectItem>
                  <SelectItem value="installment">Mensualidad / Pago</SelectItem>
                  <SelectItem value="expense">Gasto administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input type="date" value={payForm.date} onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Monto (MXN)</Label>
                <Input type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción (opcional)</Label>
              <Input value={payForm.description} onChange={(e) => setPayForm((p) => ({ ...p, description: e.target.value }))} placeholder="Mensualidad enero 2025" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => { setPayOpen(false); setEditPayment(null); }}>Cancelar</Button>
              <Button onClick={savePayment} disabled={saving || !payForm.amount || !payForm.date}>
                {saving ? 'Guardando...' : editPayment ? 'Actualizar' : 'Registrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit land dialog */}
      <Dialog open={editLandOpen} onOpenChange={setEditLandOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Editar terreno</DialogTitle></DialogHeader>
          <LandEditForm investment={land} onSuccess={() => { setEditLandOpen(false); onRefresh(); toast('Terreno actualizado'); }} onCancel={() => setEditLandOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Confirm delete payment */}
      <ConfirmDialog
        open={!!confirmPayId}
        title="¿Eliminar pago?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={async () => { if (confirmPayId) { await getInvestmentUseCases().deleteLandPayment(confirmPayId); onRefresh(); toast('Pago eliminado'); setConfirmPayId(null); } }}
        onCancel={() => setConfirmPayId(null)}
      />
    </div>
  );
}

export default function TerrenosPage() {
  const { userId } = useAuth();
  const { lands, loading, refresh } = useLands(userId);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState<{ type: 'delete' | 'complete'; id: string } | null>(null);

  const active = lands.filter((l) => l.status !== 'completed');
  const completed = lands.filter((l) => l.status === 'completed');
  const filter = (list: typeof lands) =>
    search ? list.filter((l) => l.name.toLowerCase().includes(search.toLowerCase())) : list;

  const totalPrice = active.reduce((s, l) => s + l.details.totalPrice, 0);
  const totalPaid = active.reduce((s, l) => s + l.totalPaid, 0);
  const totalRemaining = active.reduce((s, l) => s + l.remaining, 0);

  async function handleConfirm() {
    if (!confirm) return;
    if (confirm.type === 'delete') {
      await getInvestmentUseCases().deleteInvestment(confirm.id);
      toast('Terreno eliminado');
    } else {
      await getInvestmentUseCases().updateInvestment(confirm.id, { status: 'completed' });
      toast('Terreno marcado como completado');
    }
    setConfirm(null);
    refresh();
  }

  function handleExport() {
    const rows = [
      ['Terreno', 'Precio total', 'Pagado', 'Restante', 'Gastos', 'Avance %', 'Frecuencia', 'Estado'],
      ...lands.map((l) => [
        l.name, l.details.totalPrice.toFixed(2), l.totalPaid.toFixed(2),
        l.remaining.toFixed(2), l.totalExpenses.toFixed(2),
        l.completionPercent.toFixed(1) + '%', l.details.paymentFrequency, l.status,
      ]),
    ];
    downloadCsv('terrenos.csv', rows);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Terrenos</h1>
          <p className="text-slate-500">Seguimiento de compra, pagos y gastos</p>
        </div>
        <div className="flex gap-2">
          {lands.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />Exportar
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nuevo terreno</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Registrar terreno</DialogTitle></DialogHeader>
              {userId && (
                <LandForm userId={userId} onSuccess={() => { setOpen(false); refresh(); toast('Terreno registrado'); }} onCancel={() => setOpen(false)} />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      {lands.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Precio total</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalPrice)}</p>
                  <p className="mt-1 text-xs text-slate-400">{active.length} terreno{active.length !== 1 ? 's' : ''} activo{active.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
                  <TreePine className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total pagado</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(totalPaid)}</p>
                  <p className="mt-1 text-xs text-slate-400">{totalPrice > 0 ? ((totalPaid / totalPrice) * 100).toFixed(1) : '0.0'}% del total</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Por pagar</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600 tabular-nums">{formatCurrency(totalRemaining)}</p>
                  <p className="mt-1 text-xs text-slate-400">Saldo pendiente total</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      {lands.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Buscar terreno..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          <InvestmentCardSkeleton />
          <InvestmentCardSkeleton />
        </div>
      ) : lands.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TreePine className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-600">Sin terrenos registrados</h3>
            <p className="text-sm text-slate-400 mt-1 mb-4">Registra tu primer terreno para dar seguimiento a los pagos</p>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Nuevo terreno</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {filter(active).map((l) => (
            <LandSection key={l.id} land={l} onDelete={(id) => setConfirm({ type: 'delete', id })} onRefresh={refresh} onComplete={(id) => setConfirm({ type: 'complete', id })} />
          ))}
          {completed.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Completados ({completed.length})</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              {filter(completed).map((l) => (
                <LandSection key={l.id} land={l} onDelete={(id) => setConfirm({ type: 'delete', id })} onRefresh={refresh} onComplete={(id) => setConfirm({ type: 'complete', id })} />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'delete' ? '¿Eliminar terreno?' : '¿Marcar como completado?'}
        description={
          confirm?.type === 'delete'
            ? 'Esta acción no se puede deshacer. El terreno y todos sus pagos serán eliminados.'
            : 'El terreno ya no se contabilizará en los totales activos.'
        }
        confirmLabel={confirm?.type === 'delete' ? 'Eliminar' : 'Completar'}
        variant={confirm?.type === 'delete' ? 'danger' : 'default'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
