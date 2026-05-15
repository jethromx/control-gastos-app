'use client';
import { useState } from 'react';
import { Plus, Home, Trash2, Pencil, ChevronDown, ChevronUp, DollarSign, TrendingDown, Landmark, BarChart2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useFeatureFlags } from '../../../presentation/hooks/use-feature-flags';
import { SectionDisabled } from '../../../presentation/components/ui/section-disabled';
import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui/card';
import { Button } from '../../../presentation/components/ui/button';
import { Badge } from '../../../presentation/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../presentation/components/ui/dialog';
import { Input } from '../../../presentation/components/ui/input';
import { Label } from '../../../presentation/components/ui/label';
import { ConfirmDialog } from '../../../presentation/components/ui/confirm-dialog';
import { InvestmentCardSkeleton } from '../../../presentation/components/ui/investment-card-skeleton';
import { MortgageForm } from '../../../presentation/components/investments/mortgage-form';
import { useAuth } from '../../../presentation/hooks/use-auth';
import { useMortgages } from '../../../presentation/hooks/use-investments';
import { useToast } from '../../../presentation/components/ui/toast-provider';
import { formatCurrency, formatDate, formatDateInput } from '../../../presentation/lib/utils';
import { getInvestmentUseCases } from '../../../presentation/lib/di';
import type { MortgageInvestmentWithDetails, MortgagePayment } from '../../../domain/entities/investment.entity';
import { InvestmentCalculatorService } from '../../../domain/services/investment-calculator.service';

const ChartSkeleton = () => <div className="h-64 animate-pulse rounded-lg bg-slate-100" />;
const MortgageAmortizationChart = dynamic(
  () => import('../../../presentation/components/charts/mortgage-amortization-chart').then((m) => ({ default: m.MortgageAmortizationChart })),
  { ssr: false, loading: ChartSkeleton }
);

// ── Payment form ──────────────────────────────────────────────────────────
interface PaymentFormState {
  date: string; amount: string; principal: string; interest: string; balance: string; paymentNumber: string; notes: string;
}

function emptyPaymentForm(): PaymentFormState {
  return { date: new Date().toISOString().split('T')[0], amount: '', principal: '', interest: '', balance: '', paymentNumber: '', notes: '' };
}

// ── MortgageSection ───────────────────────────────────────────────────────
function MortgageSection({ mortgage, onDelete, onRefresh }: {
  mortgage: MortgageInvestmentWithDetails;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}) {
  const [chartOpen, setChartOpen] = useState(false);
  const [addPayOpen, setAddPayOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<MortgagePayment | null>(null);
  const [payForm, setPayForm] = useState<PaymentFormState>(emptyPaymentForm());
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { toast } = useToast();

  const uc = getInvestmentUseCases();
  const sortedPayments = [...mortgage.payments].sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );

  // Progress
  const pct = Math.min(100, mortgage.completionPercent);
  const monthsElapsed = mortgage.payments.length;
  const monthsRemaining = Math.max(0, mortgage.details.termMonths - monthsElapsed);
  const projectedEnd = new Date(mortgage.details.startDate);
  projectedEnd.setMonth(projectedEnd.getMonth() + mortgage.details.termMonths);

  // Next scheduled payment suggestion from amortization schedule
  const nextPaymentIdx = sortedPayments.length;
  const schedule = InvestmentCalculatorService.calcAmortizationSchedule(
    mortgage.details.originalAmount, mortgage.details.interestRate, mortgage.details.termMonths, mortgage.details.startDate
  );
  const nextScheduled = schedule[nextPaymentIdx];

  function openAdd() {
    const f = emptyPaymentForm();
    if (nextScheduled) {
      f.amount = mortgage.details.monthlyPayment.toFixed(2);
      f.interest = nextScheduled.interest.toFixed(2);
      f.principal = nextScheduled.principal.toFixed(2);
      f.balance = nextScheduled.balance.toFixed(2);
      f.paymentNumber = String(nextPaymentIdx + 1);
    }
    setPayForm(f);
    setAddPayOpen(true);
  }

  function openEdit(p: MortgagePayment) {
    setPayForm({
      date: formatDateInput(p.paymentDate),
      amount: String(p.amount),
      principal: String(p.principal),
      interest: String(p.interest),
      balance: p.balance != null ? String(p.balance) : '',
      paymentNumber: p.paymentNumber != null ? String(p.paymentNumber) : '',
      notes: p.notes ?? '',
    });
    setEditPayment(p);
  }

  async function savePayment() {
    setSaving(true);
    const data = {
      paymentDate: new Date(payForm.date),
      amount: parseFloat(payForm.amount),
      principal: parseFloat(payForm.principal) || 0,
      interest: parseFloat(payForm.interest) || 0,
      balance: payForm.balance ? parseFloat(payForm.balance) : undefined,
      paymentNumber: payForm.paymentNumber ? parseInt(payForm.paymentNumber) : undefined,
      notes: payForm.notes || undefined,
    };
    if (editPayment) {
      await uc.updateMortgagePayment(editPayment.id, data);
      toast('Pago actualizado');
      setEditPayment(null);
    } else {
      await uc.addMortgagePayment(mortgage.details.id, data);
      toast('Pago registrado');
      setAddPayOpen(false);
    }
    setSaving(false);
    onRefresh();
  }

  async function deletePayment() {
    if (!confirmId) return;
    await uc.deleteMortgagePayment(confirmId);
    toast('Pago eliminado');
    setConfirmId(null);
    onRefresh();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{mortgage.name}</h2>
            <p className="text-xs text-slate-400">{mortgage.details.bank} · {mortgage.details.termMonths} meses · {mortgage.details.interestRate}% anual</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5 mr-1" />Registrar pago
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => onDelete(mortgage.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Saldo insoluto</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">{formatCurrency(mortgage.currentBalance)}</p>
            <p className="text-xs text-slate-400 mt-0.5">deuda restante</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Capital amortizado</p>
            <p className="text-xl font-bold text-emerald-600 tabular-nums">{formatCurrency(mortgage.totalPrincipalPaid)}</p>
            <p className="text-xs text-slate-400 mt-0.5">abonado al crédito</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Intereses pagados</p>
            <p className="text-xl font-bold text-amber-600 tabular-nums">{formatCurrency(mortgage.totalInterestPaid)}</p>
            <p className="text-xs text-slate-400 mt-0.5">costo del crédito</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Pago mensual</p>
            <p className="text-xl font-bold text-indigo-600 tabular-nums">{formatCurrency(mortgage.details.monthlyPayment)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{mortgage.details.bank}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">Avance del crédito</p>
            <span className="text-sm font-bold text-indigo-600">{pct.toFixed(1)}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-slate-900">{sortedPayments.length}</p>
              <p className="text-xs text-slate-400">pagos realizados</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{monthsRemaining}</p>
              <p className="text-xs text-slate-400">meses restantes</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{projectedEnd.getFullYear()}</p>
              <p className="text-xs text-slate-400">fin estimado</p>
            </div>
          </div>
          {mortgage.details.propertyValue && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">Valor del inmueble</span>
              <span className="font-semibold text-slate-900">{formatCurrency(mortgage.details.propertyValue)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amortization chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-slate-400" />
              Tabla de amortización
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={() => setChartOpen(!chartOpen)}>
              {chartOpen ? <><ChevronUp className="h-4 w-4 mr-1" />Ocultar</> : <><ChevronDown className="h-4 w-4 mr-1" />Ver gráfica</>}
            </Button>
          </div>
        </CardHeader>
        {chartOpen && (
          <CardContent>
            <MortgageAmortizationChart details={mortgage.details} payments={mortgage.payments} />
            <p className="text-[11px] text-slate-400 mt-2">Línea punteada = saldo programado. Línea sólida = saldo real (requiere capturar saldo insoluto en cada pago).</p>
          </CardContent>
        )}
      </Card>

      {/* Payments table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">Historial de pagos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedPayments.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin pagos registrados — usa &ldquo;Registrar pago&rdquo; para comenzar</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">#</th>
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">Fecha</th>
                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Pago total</th>
                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Capital</th>
                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Interés</th>
                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Saldo</th>
                    <th className="px-4 py-2.5 w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sortedPayments.map((p) => (
                    <tr key={p.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-400">{p.paymentNumber ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600">{formatCurrency(p.principal)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600">{formatCurrency(p.interest)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500 text-xs">
                        {p.balance != null ? formatCurrency(p.balance) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(p)} className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setConfirmId(p.id)} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td className="px-4 py-3 text-xs font-bold text-slate-700" colSpan={2}>Total</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">{formatCurrency(mortgage.totalPaid)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-600">{formatCurrency(mortgage.totalPrincipalPaid)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-amber-600">{formatCurrency(mortgage.totalInterestPaid)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit payment dialog */}
      <Dialog open={addPayOpen || !!editPayment} onOpenChange={(o) => { if (!o) { setAddPayOpen(false); setEditPayment(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editPayment ? 'Editar pago' : 'Registrar pago'} — {mortgage.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Fecha <span className="text-red-500">*</span></Label>
                <Input type="date" value={payForm.date} onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>No. pago</Label>
                <Input type="number" value={payForm.paymentNumber} onChange={(e) => setPayForm((p) => ({ ...p, paymentNumber: e.target.value }))} placeholder="1" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Pago total <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} placeholder={mortgage.details.monthlyPayment.toFixed(2)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Abono a capital</Label>
                <Input type="number" step="0.01" value={payForm.principal} onChange={(e) => setPayForm((p) => ({ ...p, principal: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="grid gap-2">
                <Label>Intereses</Label>
                <Input type="number" step="0.01" value={payForm.interest} onChange={(e) => setPayForm((p) => ({ ...p, interest: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Saldo insoluto después del pago</Label>
              <Input type="number" step="0.01" value={payForm.balance} onChange={(e) => setPayForm((p) => ({ ...p, balance: e.target.value }))} placeholder="Saldo restante del crédito" />
              <p className="text-xs text-slate-400">Captura este dato para mostrar la curva real en la gráfica</p>
            </div>
            <div className="grid gap-2">
              <Label>Notas (opcional)</Label>
              <Input value={payForm.notes} onChange={(e) => setPayForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Pago adelantado, etc." />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => { setAddPayOpen(false); setEditPayment(null); }}>Cancelar</Button>
              <Button onClick={savePayment} disabled={saving || !payForm.amount || !payForm.date}>
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        title="¿Eliminar pago?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={deletePayment}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function HipotecaPage() {
  const { isEnabled } = useFeatureFlags();
  const { userId } = useAuth();
  const { mortgages, loading, refresh } = useMortgages(userId);
  const { toast } = useToast();
  const [newOpen, setNewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!isEnabled('section_hipoteca')) return <SectionDisabled label="Hipoteca" />;

  const totalBalance = mortgages.reduce((s, m) => s + m.currentBalance, 0);
  const totalPaid = mortgages.reduce((s, m) => s + m.totalPaid, 0);
  const totalInterest = mortgages.reduce((s, m) => s + m.totalInterestPaid, 0);
  const totalPrincipal = mortgages.reduce((s, m) => s + m.totalPrincipalPaid, 0);

  async function handleDelete() {
    if (!confirmDelete) return;
    await getInvestmentUseCases().deleteInvestment(confirmDelete);
    toast('Hipoteca eliminada');
    setConfirmDelete(null);
    refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hipoteca</h1>
          <p className="text-slate-500">Seguimiento y amortización del crédito hipotecario</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nueva hipoteca</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Nueva hipoteca</DialogTitle></DialogHeader>
            {userId && (
              <MortgageForm
                userId={userId}
                onSuccess={() => { setNewOpen(false); refresh(); toast('Hipoteca creada'); }}
                onCancel={() => setNewOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Global summary */}
      {mortgages.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Saldo total</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalBalance)}</p>
                  <p className="mt-1 text-xs text-slate-400">deuda vigente</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                  <Landmark className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total pagado</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalPaid)}</p>
                  <p className="mt-1 text-xs text-slate-400">mensualidades acumuladas</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100">
                  <DollarSign className="h-5 w-5 text-sky-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Capital amortizado</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(totalPrincipal)}</p>
                  <p className="mt-1 text-xs text-slate-400">abonado al crédito</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <Home className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Intereses pagados</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600 tabular-nums">{formatCurrency(totalInterest)}</p>
                  <p className="mt-1 text-xs text-slate-400">costo financiero</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                </div>
              </div>
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
      ) : mortgages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Home className="h-12 w-12 text-slate-200 mb-4" />
            <h3 className="font-semibold text-slate-600">Sin hipotecas</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">Registra tu crédito hipotecario para llevar el seguimiento de pagos y amortización.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {mortgages.map((m) => (
            <MortgageSection key={m.id} mortgage={m} onDelete={setConfirmDelete} onRefresh={refresh} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="¿Eliminar hipoteca?"
        description="Se eliminarán todos los pagos asociados. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
