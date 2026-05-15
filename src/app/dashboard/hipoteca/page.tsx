'use client';
import { useState, useMemo } from 'react';
import {
  Plus, Home, Trash2, Pencil, ChevronDown,
  DollarSign, TrendingDown, Landmark, BarChart2,
  CheckCircle2, Circle, Banknote, Eye, EyeOff, Settings2, Calculator,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useFeatureFlags } from '../../../presentation/hooks/use-feature-flags';
import { SectionDisabled } from '../../../presentation/components/ui/section-disabled';
import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui/card';
import { Button } from '../../../presentation/components/ui/button';
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

// ── types ─────────────────────────────────────────────────────────────────────
type ScheduleEntry = ReturnType<typeof InvestmentCalculatorService.calcAmortizationSchedule>[number];

type DisplayRow =
  | { kind: 'scheduled'; entry: ScheduleEntry; payment?: MortgagePayment; overdue: boolean }
  | { kind: 'extra'; payment: MortgagePayment };

interface PaymentFormState {
  date: string; amount: string; principal: string; interest: string;
  balance: string; paymentNumber: string; notes: string;
}
function emptyPaymentForm(): PaymentFormState {
  return { date: new Date().toISOString().split('T')[0], amount: '', principal: '', interest: '', balance: '', paymentNumber: '', notes: '' };
}

// ── AmortizationScheduleTable ─────────────────────────────────────────────────
function AmortizationScheduleTable({
  mortgage,
  onRefresh,
}: {
  mortgage: MortgageInvestmentWithDetails;
  onRefresh: () => void;
}) {
  const { toast } = useToast();
  const uc = getInvestmentUseCases();
  const todayStr = new Date().toISOString().split('T')[0];

  const [showPaid, setShowPaid] = useState(false);
  const [savingRow, setSavingRow] = useState<number | null>(null);
  const [chartOpen, setChartOpen] = useState(false);

  // Edit payment dialog (for pencil icon on paid rows)
  const [payForm, setPayForm] = useState<PaymentFormState>(emptyPaymentForm());
  const [editPayment, setEditPayment] = useState<MortgagePayment | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Abono a capital dialog
  const [abonoOpen, setAbonoOpen] = useState(false);
  const [abonoForm, setAbonoForm] = useState({ date: todayStr, amount: '', notes: '' });

  const paymentByNumber = useMemo(() => {
    const map = new Map<number, MortgagePayment>();
    for (const p of mortgage.payments) {
      if (p.paymentNumber != null) map.set(p.paymentNumber, p);
    }
    return map;
  }, [mortgage.payments]);

  const extraPayments = useMemo(() =>
    [...mortgage.payments.filter((p) => p.paymentNumber == null)]
      .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()),
    [mortgage.payments]);

  const schedule = useMemo(() =>
    InvestmentCalculatorService.calcDynamicAmortizationSchedule(
      mortgage.details.originalAmount,
      mortgage.details.interestRate,
      mortgage.details.termMonths,
      mortgage.details.startDate,
      extraPayments,
      mortgage.details.monthlyPayment,
    ), [mortgage.details, extraPayments]);

  const allRows = useMemo((): DisplayRow[] => {
    const today = new Date();
    const result: DisplayRow[] = [];
    let eIdx = 0;
    for (const entry of schedule) {
      const entryTime = new Date(entry.date).getTime();
      while (eIdx < extraPayments.length && new Date(extraPayments[eIdx].paymentDate).getTime() <= entryTime) {
        result.push({ kind: 'extra', payment: extraPayments[eIdx++] });
      }
      const payment = paymentByNumber.get(entry.month);
      result.push({ kind: 'scheduled', entry, payment, overdue: !payment && new Date(entry.date) < today });
    }
    while (eIdx < extraPayments.length) {
      result.push({ kind: 'extra', payment: extraPayments[eIdx++] });
    }
    return result;
  }, [schedule, paymentByNumber, extraPayments]);

  const paidCount = useMemo(() =>
    schedule.filter((_, i) => paymentByNumber.has(i + 1)).length,
    [schedule, paymentByNumber]);

  const visibleRows = useMemo(() =>
    showPaid ? allRows : allRows.filter((r) => r.kind === 'extra' || !r.payment),
    [showPaid, allRows]);

  async function quickSave(entry: ScheduleEntry) {
    setSavingRow(entry.month);
    await uc.addMortgagePayment(mortgage.details.id, {
      paymentDate: new Date(),
      amount: mortgage.details.monthlyPayment,
      principal: entry.principal,
      interest: entry.interest,
      paymentNumber: entry.month,
      // balance omitted — currentBalance is always derived from originalAmount − Σprincipal
    });
    setSavingRow(null);
    toast(`Pago #${entry.month} registrado`);
    onRefresh();
  }

  function openEditPayment(entry: ScheduleEntry, p: MortgagePayment) {
    setEditPayment(p);
    setPayForm({
      date: formatDateInput(p.paymentDate),
      amount: String(p.amount),
      principal: String(p.principal),
      interest: String(p.interest),
      balance: p.balance != null ? String(p.balance) : '',
      paymentNumber: String(entry.month),
      notes: p.notes ?? '',
    });
  }

  async function saveEditPayment() {
    if (!editPayment) return;
    setEditSaving(true);
    await uc.updateMortgagePayment(editPayment.id, {
      paymentDate: new Date(payForm.date + 'T12:00:00'),
      amount: parseFloat(payForm.amount),
      principal: parseFloat(payForm.principal) || 0,
      interest: parseFloat(payForm.interest) || 0,
      balance: payForm.balance ? parseFloat(payForm.balance) : undefined,
      paymentNumber: payForm.paymentNumber ? parseInt(payForm.paymentNumber) : undefined,
      notes: payForm.notes || undefined,
    });
    toast('Pago actualizado');
    setEditSaving(false);
    setEditPayment(null);
    onRefresh();
  }

  async function saveAbono() {
    setSavingRow(-1);
    const amount = parseFloat(abonoForm.amount);
    await uc.addMortgagePayment(mortgage.details.id, {
      paymentDate: new Date(abonoForm.date + 'T12:00:00'),
      amount,
      principal: amount,
      interest: 0,
      notes: abonoForm.notes || 'Abono a capital',
    });
    toast('Abono a capital registrado');
    setAbonoOpen(false);
    setAbonoForm({ date: todayStr, amount: '', notes: '' });
    setSavingRow(null);
    onRefresh();
  }

  async function deletePaymentConfirmed() {
    if (!confirmDeleteId) return;
    await uc.deleteMortgagePayment(confirmDeleteId);
    toast('Pago eliminado');
    setConfirmDeleteId(null);
    onRefresh();
  }

  return (
    <>
      {/* Amortization chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-slate-400" />
              Curva de amortización
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={() => setChartOpen(!chartOpen)}>
              {chartOpen ? <><EyeOff className="h-4 w-4 mr-1" />Ocultar</> : <><Eye className="h-4 w-4 mr-1" />Ver gráfica</>}
            </Button>
          </div>
        </CardHeader>
        {chartOpen && (
          <CardContent>
            <MortgageAmortizationChart details={mortgage.details} payments={mortgage.payments} />
            <p className="text-[11px] text-slate-400 mt-2">Línea punteada = saldo programado · Línea sólida = saldo real según pagos registrados</p>
          </CardContent>
        )}
      </Card>

      {/* Schedule table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm font-semibold text-slate-700">Tabla de amortización</CardTitle>
            <div className="flex items-center gap-2">
              {paidCount > 0 && (
                <button
                  onClick={() => setShowPaid(!showPaid)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {showPaid
                    ? <><EyeOff className="h-3.5 w-3.5" />Ocultar realizados</>
                    : <><Eye className="h-3.5 w-3.5" />Ver realizados ({paidCount})</>}
                </button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => { setAbonoOpen(true); setAbonoForm({ date: todayStr, amount: '', notes: '' }); }}
              >
                <Banknote className="h-3.5 w-3.5 mr-1" />Abono a capital
              </Button>
            </div>
          </div>
          {extraPayments.length > 0 && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {extraPayments.length} abono{extraPayments.length !== 1 ? 's' : ''} a capital registrado{extraPayments.length !== 1 ? 's' : ''}
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[520px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-100 bg-white">
                <tr>
                  <th className="w-10 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400">Fecha</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400">Mensualidad</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400">Capital</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400">Interés</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400">Saldo</th>
                  <th className="w-20 px-4 py-2.5 text-center text-xs font-semibold text-slate-400">Pagado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visibleRows.map((row) => {
                  if (row.kind === 'extra') {
                    return (
                      <tr key={`extra-${row.payment.id}`} className="group bg-emerald-50/60">
                        <td className="px-4 py-3 text-xs font-bold text-emerald-500">↓</td>
                        <td className="px-4 py-3 text-xs text-emerald-700">{formatDate(row.payment.paymentDate)}</td>
                        <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 tabular-nums">
                          {formatCurrency(row.payment.amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-emerald-600 tabular-nums">
                          {formatCurrency(row.payment.principal)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-slate-300 tabular-nums">—</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-400 tabular-nums">
                          {row.payment.balance != null ? formatCurrency(row.payment.balance) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => setConfirmDeleteId(row.payment.id)}
                              className="rounded p-0.5 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const { entry, payment, overdue } = row;
                  const isPaid = !!payment;
                  return (
                    <tr
                      key={entry.month}
                      className={`group transition-colors ${
                        isPaid ? 'bg-slate-50/40' : overdue ? 'bg-amber-50/50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className={`px-4 py-3 text-xs tabular-nums ${isPaid ? 'text-slate-300' : overdue ? 'text-amber-500 font-medium' : 'text-slate-400'}`}>
                        {entry.month}
                      </td>
                      <td className={`px-4 py-3 text-xs ${isPaid ? 'text-slate-400' : overdue ? 'text-amber-700' : 'text-slate-600'}`}>
                        <span>{formatDate(entry.date)}</span>
                        {isPaid && payment && (
                          <span className="ml-2 text-[10px] text-slate-400">
                            ✓ {formatDate(payment.paymentDate)}
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right text-xs font-semibold tabular-nums ${isPaid ? 'text-slate-400' : 'text-slate-800'}`}>
                        {formatCurrency(entry.payment)}
                      </td>
                      <td className={`px-4 py-3 text-right text-xs tabular-nums ${isPaid ? 'text-slate-300' : 'text-emerald-600'}`}>
                        {formatCurrency(entry.principal)}
                      </td>
                      <td className={`px-4 py-3 text-right text-xs tabular-nums ${isPaid ? 'text-slate-300' : 'text-amber-600'}`}>
                        {formatCurrency(entry.interest)}
                      </td>
                      <td className={`px-4 py-3 text-right text-xs tabular-nums ${isPaid ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isPaid && payment?.balance != null
                          ? formatCurrency(payment.balance)
                          : formatCurrency(entry.balance)}
                      </td>
                      <td className="px-4 py-3">
                        {isPaid ? (
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                            <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => openEditPayment(entry, payment!)}
                                className="rounded p-0.5 text-slate-400 hover:text-indigo-600"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(payment!.id)}
                                className="rounded p-0.5 text-slate-400 hover:text-red-500"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => quickSave(entry)}
                            disabled={savingRow === entry.month}
                            className="flex w-full items-center justify-center disabled:opacity-40"
                            title="Marcar como pagado"
                          >
                            {savingRow === entry.month
                              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                              : <Circle className={`h-5 w-5 transition-colors ${overdue ? 'text-amber-300 hover:text-amber-500' : 'text-slate-200 hover:text-indigo-400'}`} />
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!showPaid && paidCount > 0 && (
            <button
              onClick={() => setShowPaid(true)}
              className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50 py-2.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Ver {paidCount} pago{paidCount !== 1 ? 's' : ''} realizado{paidCount !== 1 ? 's' : ''}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Edit payment dialog */}
      <Dialog open={!!editPayment} onOpenChange={(o) => { if (!o) setEditPayment(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar pago #{payForm.paymentNumber} — {mortgage.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Fecha <span className="text-red-500">*</span></Label>
                <Input type="date" value={payForm.date} onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>No. pago</Label>
                <Input type="number" value={payForm.paymentNumber} disabled className="bg-slate-50 text-slate-400" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Pago total <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Abono a capital</Label>
                <Input type="number" step="0.01" value={payForm.principal} onChange={(e) => setPayForm((p) => ({ ...p, principal: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Intereses</Label>
                <Input type="number" step="0.01" value={payForm.interest} onChange={(e) => setPayForm((p) => ({ ...p, interest: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Saldo insoluto</Label>
              <Input type="number" step="0.01" value={payForm.balance} onChange={(e) => setPayForm((p) => ({ ...p, balance: e.target.value }))} placeholder="Saldo después del pago" />
              <p className="text-[11px] text-slate-400">Captura para mostrar la curva real en la gráfica</p>
            </div>
            <div className="grid gap-2">
              <Label>Notas (opcional)</Label>
              <Input value={payForm.notes} onChange={(e) => setPayForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Observaciones" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditPayment(null)}>Cancelar</Button>
              <Button onClick={saveEditPayment} disabled={editSaving || !payForm.amount}>
                {editSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Abono a capital dialog */}
      <Dialog open={abonoOpen} onOpenChange={setAbonoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Abono a capital — {mortgage.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-slate-500 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              Un abono a capital reduce el saldo de tu crédito directamente, sin pasar por intereses.
            </p>
            <div className="grid gap-2">
              <Label>Fecha <span className="text-red-500">*</span></Label>
              <Input type="date" value={abonoForm.date} onChange={(e) => setAbonoForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Monto del abono <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" value={abonoForm.amount} onChange={(e) => setAbonoForm((f) => ({ ...f, amount: e.target.value }))} placeholder="50000" />
            </div>
            <div className="grid gap-2">
              <Label>Notas (opcional)</Label>
              <Input value={abonoForm.notes} onChange={(e) => setAbonoForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Aguinaldo, bono, etc." />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setAbonoOpen(false)}>Cancelar</Button>
              <Button onClick={saveAbono} disabled={savingRow === -1 || !abonoForm.amount || !abonoForm.date} className="bg-emerald-600 hover:bg-emerald-700">
                {savingRow === -1 ? 'Guardando...' : 'Registrar abono'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="¿Eliminar pago?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={deletePaymentConfirmed}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </>
  );
}

function calcMonthlyPayment(balance: number, annualRate: number, months: number) {
  if (!balance || !months) return 0;
  const r = annualRate / 100 / 12;
  return r === 0 ? balance / months : (balance * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

// ── MortgageSection ───────────────────────────────────────────────────────────
function MortgageSection({
  mortgage,
  onDelete,
  onRefresh,
}: {
  mortgage: MortgageInvestmentWithDetails;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [restructureOpen, setRestructureOpen] = useState(false);
  const [rForm, setRForm] = useState({ currentPayment: '', totalPayments: '', balance: '', rate: '' });
  const [restructureSaving, setRestructureSaving] = useState(false);
  const { toast } = useToast();
  const pct = Math.min(100, mortgage.completionPercent);
  const monthsRemaining = Math.max(0, mortgage.details.termMonths - mortgage.payments.filter((p) => p.paymentNumber != null).length);
  const projectedEnd = new Date(mortgage.details.startDate);
  projectedEnd.setMonth(projectedEnd.getMonth() + mortgage.details.termMonths);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900">{mortgage.name}</h2>
            <p className="text-xs text-slate-400">
              {mortgage.details.bank} · {mortgage.details.termMonths} meses · {mortgage.details.interestRate}% anual
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-violet-600"
            onClick={() => {
              setRForm({
                currentPayment: String(mortgage.payments.filter(p => p.paymentNumber != null).length),
                totalPayments: String(mortgage.details.termMonths),
                balance: String(Math.round(mortgage.currentBalance)),
                rate: String(mortgage.details.interestRate),
              });
              setRestructureOpen(true);
            }}
            title="Reestructurar crédito"
          >
            <Calculator className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-indigo-600"
            onClick={() => setEditOpen(true)}
            title="Editar hipoteca"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-500"
            onClick={() => onDelete(mortgage.id)}
            title="Eliminar hipoteca"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Restructure dialog */}
      {(() => {
        const current = parseInt(rForm.currentPayment) || 0;
        const total   = parseInt(rForm.totalPayments)  || 0;
        const remaining = Math.max(0, total - current);
        const balance   = parseFloat(rForm.balance)    || 0;
        const rate      = parseFloat(rForm.rate)        || mortgage.details.interestRate;
        const newPayment = remaining > 0 && balance > 0 ? calcMonthlyPayment(balance, rate, remaining) : 0;

        async function handleRestructure() {
          if (!remaining || !balance || !newPayment) return;
          setRestructureSaving(true);
          // Anchor startDate so that month `current` falls on today,
          // and originalAmount becomes the real bank balance.
          // This makes the schedule produce correct capital/interest
          // from the actual outstanding balance going forward.
          const newStartDate = new Date();
          newStartDate.setDate(1); // avoid day-overflow on month arithmetic
          newStartDate.setMonth(newStartDate.getMonth() - current);
          await getInvestmentUseCases().updateMortgageDetails(mortgage.details.id, {
            originalAmount: balance,
            termMonths: total,
            monthlyPayment: parseFloat(newPayment.toFixed(2)),
            interestRate: rate,
            startDate: newStartDate,
          });
          toast('Crédito reestructurado');
          setRestructureSaving(false);
          setRestructureOpen(false);
          onRefresh();
        }

        return (
          <Dialog open={restructureOpen} onOpenChange={setRestructureOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-violet-500" />
                  Reestructurar crédito — {mortgage.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-xs text-slate-500 bg-violet-50 rounded-lg p-3 border border-violet-100">
                  Actualiza el número de recibo actual y el total para recalcular la mensualidad con el saldo vigente.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Recibo actual <span className="text-red-500">*</span></Label>
                    <Input
                      type="number" min="0"
                      value={rForm.currentPayment}
                      onChange={e => setRForm(f => ({ ...f, currentPayment: e.target.value }))}
                      placeholder="43"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Total de recibos <span className="text-red-500">*</span></Label>
                    <Input
                      type="number" min="1"
                      value={rForm.totalPayments}
                      onChange={e => setRForm(f => ({ ...f, totalPayments: e.target.value }))}
                      placeholder="109"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Saldo actual <span className="text-red-500">*</span></Label>
                    <Input
                      type="number" step="0.01"
                      value={rForm.balance}
                      onChange={e => setRForm(f => ({ ...f, balance: e.target.value }))}
                      placeholder={String(Math.round(mortgage.currentBalance))}
                    />
                    <p className="text-[11px] text-slate-400">Saldo calculado: {formatCurrency(mortgage.currentBalance)}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Tasa anual (%)</Label>
                    <Input
                      type="number" step="0.01"
                      value={rForm.rate}
                      onChange={e => setRForm(f => ({ ...f, rate: e.target.value }))}
                      placeholder={String(mortgage.details.interestRate)}
                    />
                  </div>
                </div>

                {remaining > 0 && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Recibos restantes</span>
                      <span className="font-semibold text-slate-800">{remaining} meses</span>
                    </div>
                    {newPayment > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Nueva mensualidad</span>
                        <span className="text-lg font-bold text-violet-600">{formatCurrency(newPayment)}</span>
                      </div>
                    )}
                    {newPayment > 0 && (
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Mensualidad anterior</span>
                        <span className={newPayment < mortgage.details.monthlyPayment ? 'text-emerald-600' : 'text-amber-600'}>
                          {formatCurrency(mortgage.details.monthlyPayment)}
                          {newPayment < mortgage.details.monthlyPayment ? ' ↓' : ' ↑'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={() => setRestructureOpen(false)}>Cancelar</Button>
                  <Button
                    disabled={restructureSaving || !remaining || !newPayment}
                    onClick={handleRestructure}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {restructureSaving ? 'Guardando...' : 'Aplicar reestructura'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Editar hipoteca</DialogTitle></DialogHeader>
          <MortgageForm
            mode="edit"
            investmentId={mortgage.id}
            detailsId={mortgage.details.id}
            initialValues={{
              name: mortgage.name,
              bank: mortgage.details.bank,
              originalAmount: mortgage.details.originalAmount,
              interestRate: mortgage.details.interestRate,
              termMonths: mortgage.details.termMonths,
              startDate: mortgage.details.startDate,
              monthlyPayment: mortgage.details.monthlyPayment,
              propertyValue: mortgage.details.propertyValue,
              accountNumber: mortgage.details.accountNumber,
            }}
            onSuccess={() => { setEditOpen(false); onRefresh(); toast('Hipoteca actualizada'); }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Saldo insoluto</p>
            <p className="text-xl font-bold tabular-nums text-slate-900">{formatCurrency(mortgage.currentBalance)}</p>
            <p className="mt-0.5 text-xs text-slate-400">deuda restante</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Capital amortizado</p>
            <p className="text-xl font-bold tabular-nums text-emerald-600">{formatCurrency(mortgage.totalPrincipalPaid)}</p>
            <p className="mt-0.5 text-xs text-slate-400">abonado al crédito</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Intereses pagados</p>
            <p className="text-xl font-bold tabular-nums text-amber-600">{formatCurrency(mortgage.totalInterestPaid)}</p>
            <p className="mt-0.5 text-xs text-slate-400">costo del crédito</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Pago mensual</p>
            <p className="text-xl font-bold tabular-nums text-indigo-600">{formatCurrency(mortgage.details.monthlyPayment)}</p>
            <p className="mt-0.5 text-xs text-slate-400">{mortgage.details.bank}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Avance del crédito</p>
            <span className="text-sm font-bold text-indigo-600">{pct.toFixed(1)}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-slate-900">{mortgage.payments.filter((p) => p.paymentNumber != null).length}</p>
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
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">Valor del inmueble</span>
              <span className="font-semibold text-slate-900">{formatCurrency(mortgage.details.propertyValue)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amortization schedule table + chart */}
      <AmortizationScheduleTable mortgage={mortgage} onRefresh={onRefresh} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
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
            <Button><Plus className="mr-2 h-4 w-4" />Nueva hipoteca</Button>
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
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Saldo total</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{formatCurrency(totalBalance)}</p>
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
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total pagado</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{formatCurrency(totalPaid)}</p>
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
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Capital amortizado</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-600">{formatCurrency(totalPrincipal)}</p>
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
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Intereses pagados</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-amber-600">{formatCurrency(totalInterest)}</p>
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
        </div>
      ) : mortgages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Home className="mb-4 h-12 w-12 text-slate-200" />
            <h3 className="font-semibold text-slate-600">Sin hipotecas</h3>
            <p className="mt-1 max-w-xs text-sm text-slate-400">Registra tu crédito hipotecario para llevar el seguimiento de pagos y amortización.</p>
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
