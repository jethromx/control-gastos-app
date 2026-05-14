'use client';
import { useState } from 'react';
import { Plus, TreePine, Trash2, ChevronDown, ChevronUp, Pencil, Search, CheckCircle, Download, DollarSign, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui/card';
import { Button } from '../../../presentation/components/ui/button';
import { Badge } from '../../../presentation/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../presentation/components/ui/dialog';
import { Input } from '../../../presentation/components/ui/input';
import { Label } from '../../../presentation/components/ui/label';
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
import { LandInvestmentWithDetails, LandPayment } from '../../../domain/entities/investment.entity';

function LandCard({ land, onDelete, onRefresh, onComplete }: {
  land: LandInvestmentWithDetails;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onComplete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addPayOpen, setAddPayOpen] = useState(false);
  const [editLandOpen, setEditLandOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<LandPayment | null>(null);
  const [payForm, setPayForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '', type: 'installment' as 'installment' | 'expense', description: '' });
  const [saving, setSaving] = useState(false);
  const [confirmPayId, setConfirmPayId] = useState<string | null>(null);
  const { toast } = useToast();
  const isCompleted = land.status === 'completed';
  const uc = getInvestmentUseCases();
  const freqLabel = { monthly: 'Mensual', biweekly: 'Quincenal', custom: 'Personalizado' }[land.details.paymentFrequency];

  async function savePayment() {
    setSaving(true);
    if (editPayment) {
      await uc.updateLandPayment(editPayment.id, { paymentDate: new Date(payForm.date), amount: parseFloat(payForm.amount), paymentType: payForm.type, description: payForm.description || undefined });
      setEditPayment(null);
      toast('Pago actualizado');
    } else {
      await uc.addLandPayment(land.details.id, { paymentDate: new Date(payForm.date), amount: parseFloat(payForm.amount), paymentType: payForm.type, description: payForm.description || undefined });
      setAddPayOpen(false);
      toast('Pago registrado');
    }
    onRefresh(); setSaving(false);
  }

  async function deletePayment(id: string) {
    await uc.deleteLandPayment(id);
    onRefresh();
    toast('Pago eliminado');
    setConfirmPayId(null);
  }

  function openEditPayment(p: LandPayment) {
    setPayForm({ date: formatDateInput(p.paymentDate), amount: String(p.amount), type: p.paymentType as 'installment' | 'expense', description: p.description ?? '' });
    setEditPayment(p);
  }

  return (
    <Card className={`transition-shadow cursor-pointer ${isCompleted ? 'opacity-60' : 'hover:shadow-lg'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-semibold leading-tight">{land.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{freqLabel}</Badge>
              {land.completionPercent >= 100 && <Badge variant="success">Pagado</Badge>}
              {isCompleted && <Badge variant="secondary" className="text-xs">Completado</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isCompleted && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600" onClick={() => setEditLandOpen(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-green-600" title="Marcar como completado" onClick={() => onComplete(land.id)}>
                  <CheckCircle className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => onDelete(land.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-xs text-gray-500">Precio total</p><p className="font-semibold">{formatCurrency(land.details.totalPrice)}</p></div>
          <div><p className="text-xs text-gray-500">Pagado</p><p className="font-semibold text-green-600">{formatCurrency(land.totalPaid)}</p></div>
          <div><p className="text-xs text-gray-500">Restante</p><p className="font-semibold text-amber-600">{formatCurrency(land.remaining)}</p></div>
          <div><p className="text-xs text-gray-500">Gastos extra</p><p className="font-semibold text-red-500">{formatCurrency(land.totalExpenses)}</p></div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Avance</span><span>{land.completionPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-green-500 transition-all" style={{ width: `${Math.min(land.completionPercent, 100)}%` }} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setPayForm({ date: new Date().toISOString().split('T')[0], amount: '', type: 'installment', description: '' }); setAddPayOpen(true); }}>+ Pago</Button>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <LandPaymentsChart payments={land.payments} totalPrice={land.details.totalPrice} />
            <p className="text-xs font-semibold text-gray-500 mb-2">Historial de pagos</p>
            {land.payments.length === 0 ? (
              <p className="text-xs text-gray-400">Sin pagos registrados</p>
            ) : (
              land.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs group">
                  <span className="text-gray-500 w-20 shrink-0">{formatDate(p.paymentDate)}</span>
                  <span className="text-gray-600 flex-1 truncate px-2">{p.description || (p.paymentType === 'initial' ? 'Enganche' : p.paymentType === 'expense' ? 'Gasto' : 'Mensualidad')}</span>
                  <span className={`font-medium mr-2 ${p.paymentType === 'expense' ? 'text-red-500' : 'text-green-600'}`}>{formatCurrency(p.amount)}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEditPayment(p)} className="text-indigo-500 hover:text-indigo-700"><Pencil className="h-3 w-3" /></button>
                    <button onClick={() => setConfirmPayId(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>

      {/* Add / Edit Payment */}
      <Dialog open={addPayOpen || !!editPayment} onOpenChange={(o) => { if (!o) { setAddPayOpen(false); setEditPayment(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editPayment ? 'Editar pago' : 'Registrar pago'} — {land.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2"><Label>Fecha</Label><Input type="date" value={payForm.date} onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))} /></div>
            <div className="grid gap-2">
              <Label>Tipo de pago</Label>
              <Select value={payForm.type} onValueChange={(v) => setPayForm((p) => ({ ...p, type: v as 'installment' | 'expense' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="installment">Mensualidad / Pago</SelectItem>
                  <SelectItem value="expense">Gasto administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Monto (MXN)</Label><Input type="number" step="0.01" value={payForm.amount} onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} placeholder="5000" /></div>
            <div className="grid gap-2"><Label>Descripción (opcional)</Label><Input value={payForm.description} onChange={(e) => setPayForm((p) => ({ ...p, description: e.target.value }))} placeholder="Mensualidad enero 2025" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setAddPayOpen(false); setEditPayment(null); }}>Cancelar</Button>
              <Button onClick={savePayment} disabled={saving || !payForm.amount}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Land */}
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
        onConfirm={() => confirmPayId && deletePayment(confirmPayId)}
        onCancel={() => setConfirmPayId(null)}
      />
    </Card>
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
  const filterList = (list: typeof lands) =>
    search ? list.filter((l) => l.name.toLowerCase().includes(search.toLowerCase())) : list;

  function handleDelete(id: string) {
    setConfirm({ type: 'delete', id });
  }

  function handleComplete(id: string) {
    setConfirm({ type: 'complete', id });
  }

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
      ['Terreno', 'Precio total', 'Pagado', 'Restante', 'Gastos extra', 'Avance %', 'Frecuencia', 'Estado'],
      ...lands.map((l) => [
        l.name,
        l.details.totalPrice.toFixed(2),
        l.totalPaid.toFixed(2),
        l.remaining.toFixed(2),
        l.totalExpenses.toFixed(2),
        l.completionPercent.toFixed(1) + '%',
        l.details.paymentFrequency,
        l.status,
      ]),
    ];
    downloadCsv('terrenos.csv', rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Terrenos</h1>
          <p className="text-slate-500">Seguimiento de compra, pagos y gastos</p>
        </div>
        <div className="flex gap-2">
          {lands.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Exportar</Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nuevo terreno</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Registrar terreno</DialogTitle></DialogHeader>
            {userId && <LandForm userId={userId} onSuccess={() => { setOpen(false); refresh(); toast('Terreno registrado'); }} onCancel={() => setOpen(false)} />}
          </DialogContent>
        </Dialog>
        </div>
      </div>
      {/* Summary cards */}
      {lands.length > 0 && (() => {
        const activeLands = lands.filter(l => l.status !== 'completed');
        const totalPrice = activeLands.reduce((s, l) => s + l.details.totalPrice, 0);
        const totalPaid = activeLands.reduce((s, l) => s + l.totalPaid, 0);
        const totalRemaining = activeLands.reduce((s, l) => s + l.remaining, 0);
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Precio total</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalPrice)}</p>
                    <p className="mt-1 text-xs text-slate-400">{activeLands.length} terreno{activeLands.length !== 1 ? 's' : ''} activo{activeLands.length !== 1 ? 's' : ''}</p>
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
                  <div className="min-w-0">
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
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Por pagar</p>
                    <p className="mt-2 text-2xl font-bold text-amber-600 tabular-nums">{formatCurrency(totalRemaining)}</p>
                    <p className="mt-1 text-xs text-slate-400">Saldo pendiente</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {lands.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar terreno..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InvestmentCardSkeleton />
          <InvestmentCardSkeleton />
          <InvestmentCardSkeleton />
        </div>
      ) : lands.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center"><TreePine className="h-12 w-12 text-gray-300 mb-4" /><h3 className="font-semibold text-gray-600">Sin terrenos</h3><p className="text-sm text-gray-400 mt-1">Registra tu primer terreno</p></CardContent></Card>
      ) : (
        <>
          {active.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filterList(active).map((l) => <LandCard key={l.id} land={l} onDelete={handleDelete} onRefresh={refresh} onComplete={handleComplete} />)}
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Completados ({completed.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filterList(completed).map((l) => <LandCard key={l.id} land={l} onDelete={handleDelete} onRefresh={refresh} onComplete={handleComplete} />)}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'delete' ? '¿Eliminar terreno?' : '¿Marcar como completado?'}
        description={
          confirm?.type === 'delete'
            ? 'Esta acción no se puede deshacer. El terreno será eliminado permanentemente.'
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
