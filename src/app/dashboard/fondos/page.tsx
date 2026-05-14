'use client';
import { useState } from 'react';
import { Plus, Wallet, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Pencil, Search, CheckCircle, Download, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui/card';
import { Button } from '../../../presentation/components/ui/button';
import { Badge } from '../../../presentation/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../presentation/components/ui/dialog';
import { Input } from '../../../presentation/components/ui/input';
import { Label } from '../../../presentation/components/ui/label';
import { ConfirmDialog } from '../../../presentation/components/ui/confirm-dialog';
import { InvestmentCardSkeleton } from '../../../presentation/components/ui/investment-card-skeleton';
import { FundForm } from '../../../presentation/components/investments/fund-form';
import { FundChart } from '../../../presentation/components/charts/fund-chart';
import { useAuth } from '../../../presentation/hooks/use-auth';
import { useFunds } from '../../../presentation/hooks/use-investments';
import { useToast } from '../../../presentation/components/ui/toast-provider';
import { formatCurrency, formatDate, formatDateInput } from '../../../presentation/lib/utils';
import { downloadCsv } from '../../../presentation/lib/export';
import { getInvestmentUseCases } from '../../../presentation/lib/di';
import { FundInvestmentWithDetails, FundTransaction, FundTitleValue } from '../../../domain/entities/investment.entity';

function FundCard({ fund, onDelete, onRefresh, onComplete }: {
  fund: FundInvestmentWithDetails;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onComplete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [addValueOpen, setAddValueOpen] = useState(false);
  const [editTx, setEditTx] = useState<FundTransaction | null>(null);
  const [editValue, setEditValue] = useState<FundTitleValue | null>(null);
  const [txForm, setTxForm] = useState({ date: new Date().toISOString().split('T')[0], qty: '', cost: '' });
  const [valueForm, setValueForm] = useState({ date: new Date().toISOString().split('T')[0], value: '' });
  const [saving, setSaving] = useState(false);
  const [confirmTx, setConfirmTx] = useState<string | null>(null);
  const [confirmValue, setConfirmValue] = useState<string | null>(null);
  const { toast } = useToast();

  const gainPositive = fund.gainLoss >= 0;
  const isCompleted = fund.status === 'completed';
  const uc = getInvestmentUseCases();

  async function addTransaction() {
    setSaving(true);
    const qty = parseFloat(txForm.qty), cost = parseFloat(txForm.cost);
    await uc.addFundTransaction(fund.id, { transactionDate: new Date(txForm.date), titlesQuantity: qty, titleCost: cost, totalAmount: qty * cost });
    setAddTxOpen(false); setTxForm({ date: new Date().toISOString().split('T')[0], qty: '', cost: '' });
    onRefresh(); setSaving(false);
    toast('Compra registrada');
  }

  async function saveEditTx() {
    if (!editTx) return;
    setSaving(true);
    const qty = parseFloat(txForm.qty), cost = parseFloat(txForm.cost);
    await uc.updateFundTransaction(editTx.id, { transactionDate: new Date(txForm.date), titlesQuantity: qty, titleCost: cost, totalAmount: qty * cost });
    setEditTx(null); onRefresh(); setSaving(false);
    toast('Compra actualizada');
  }

  async function deleteTx(id: string) {
    await uc.deleteFundTransaction(id);
    onRefresh();
    toast('Transacción eliminada');
    setConfirmTx(null);
  }

  async function addTitleValue() {
    setSaving(true);
    await uc.addTitleValue(fund.id, { date: new Date(valueForm.date), titleValue: parseFloat(valueForm.value) });
    setAddValueOpen(false); setValueForm({ date: new Date().toISOString().split('T')[0], value: '' });
    onRefresh(); setSaving(false);
    toast('Valor de título registrado');
  }

  async function saveEditValue() {
    if (!editValue) return;
    setSaving(true);
    await uc.updateTitleValue(editValue.id, { titleValue: parseFloat(valueForm.value), date: new Date(valueForm.date) });
    setEditValue(null); onRefresh(); setSaving(false);
    toast('Valor actualizado');
  }

  async function deleteValue(id: string) {
    await uc.deleteTitleValue(id);
    onRefresh();
    toast('Valor eliminado');
    setConfirmValue(null);
  }

  function openEditTx(t: FundTransaction) {
    setTxForm({ date: formatDateInput(t.transactionDate), qty: String(t.titlesQuantity), cost: String(t.titleCost) });
    setEditTx(t);
  }

  function openEditValue(v: FundTitleValue) {
    setValueForm({ date: formatDateInput(v.date), value: String(v.titleValue) });
    setEditValue(v);
  }

  return (
    <Card className={`transition-shadow cursor-pointer ${isCompleted ? 'opacity-60' : 'hover:shadow-lg'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-semibold leading-tight">{fund.name}</CardTitle>
            {isCompleted && <Badge variant="secondary" className="mt-1 w-fit text-xs">Completado</Badge>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isCompleted && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-green-600" title="Marcar como completado" onClick={() => onComplete(fund.id)}>
                <CheckCircle className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => onDelete(fund.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-xs text-gray-500">Títulos</p><p className="font-semibold">{fund.totalTitles.toFixed(4)}</p></div>
          <div><p className="text-xs text-gray-500">Valor título actual</p><p className="font-semibold">${fund.currentTitleValue.toFixed(4)}</p></div>
          <div><p className="text-xs text-gray-500">Invertido</p><p className="font-semibold">{formatCurrency(fund.totalInvested)}</p></div>
          <div><p className="text-xs text-gray-500">Valor actual</p><p className="font-semibold text-indigo-600">{formatCurrency(fund.currentValue)}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {gainPositive
            ? <Badge variant="success" className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />+{formatCurrency(fund.gainLoss)} ({fund.gainLossPercent.toFixed(2)}%)</Badge>
            : <Badge variant="destructive" className="flex items-center gap-1"><TrendingDown className="h-3 w-3" />{formatCurrency(fund.gainLoss)} ({fund.gainLossPercent.toFixed(2)}%)</Badge>}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setTxForm({ date: new Date().toISOString().split('T')[0], qty: '', cost: '' }); setAddTxOpen(true); }}>+ Compra</Button>
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setValueForm({ date: new Date().toISOString().split('T')[0], value: '' }); setAddValueOpen(true); }}>+ Valor título</Button>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="pt-2 space-y-4 border-t border-gray-100">
            <FundChart history={fund.titleHistory} />

            {/* Title value history */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Historial de valores de título</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {fund.titleHistory.length === 0 ? <p className="text-xs text-gray-400">Sin historial</p> : fund.titleHistory.slice().reverse().map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-xs group">
                    <span className="text-gray-500">{formatDate(v.date)}</span>
                    <span className="font-medium text-gray-700">${v.titleValue.toFixed(6)}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditValue(v)} className="text-indigo-500 hover:text-indigo-700"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => setConfirmValue(v.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Historial de compras</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {fund.transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-xs group">
                    <span className="text-gray-500">{formatDate(t.transactionDate)}</span>
                    <span className="text-gray-600">{t.titlesQuantity.toFixed(4)} @ ${t.titleCost.toFixed(4)}</span>
                    <span className="font-medium">{formatCurrency(t.totalAmount)}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditTx(t)} className="text-indigo-500 hover:text-indigo-700"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => setConfirmTx(t.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Add / Edit Transaction */}
      <Dialog open={addTxOpen || !!editTx} onOpenChange={(o) => { if (!o) { setAddTxOpen(false); setEditTx(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editTx ? 'Editar compra' : 'Nueva compra'} — {fund.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2"><Label>Fecha</Label><Input type="date" value={txForm.date} onChange={(e) => setTxForm((p) => ({ ...p, date: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Títulos</Label><Input type="number" step="0.0001" value={txForm.qty} onChange={(e) => setTxForm((p) => ({ ...p, qty: e.target.value }))} placeholder="1000" /></div>
            <div className="grid gap-2"><Label>Costo por título</Label><Input type="number" step="0.000001" value={txForm.cost} onChange={(e) => setTxForm((p) => ({ ...p, cost: e.target.value }))} placeholder="1.2345" /></div>
            {txForm.qty && txForm.cost && <p className="text-sm text-gray-600">Total: {formatCurrency(parseFloat(txForm.qty) * parseFloat(txForm.cost))}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setAddTxOpen(false); setEditTx(null); }}>Cancelar</Button>
              <Button onClick={editTx ? saveEditTx : addTransaction} disabled={saving || !txForm.qty || !txForm.cost}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Title Value */}
      <Dialog open={addValueOpen || !!editValue} onOpenChange={(o) => { if (!o) { setAddValueOpen(false); setEditValue(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editValue ? 'Editar valor' : 'Nuevo valor de título'} — {fund.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2"><Label>Fecha</Label><Input type="date" value={valueForm.date} onChange={(e) => setValueForm((p) => ({ ...p, date: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Valor del título</Label><Input type="number" step="0.000001" value={valueForm.value} onChange={(e) => setValueForm((p) => ({ ...p, value: e.target.value }))} placeholder="1.2567" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setAddValueOpen(false); setEditValue(null); }}>Cancelar</Button>
              <Button onClick={editValue ? saveEditValue : addTitleValue} disabled={saving || !valueForm.value}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete transaction */}
      <ConfirmDialog
        open={!!confirmTx}
        title="¿Eliminar transacción?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={() => confirmTx && deleteTx(confirmTx)}
        onCancel={() => setConfirmTx(null)}
      />

      {/* Confirm delete title value */}
      <ConfirmDialog
        open={!!confirmValue}
        title="¿Eliminar valor?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={() => confirmValue && deleteValue(confirmValue)}
        onCancel={() => setConfirmValue(null)}
      />
    </Card>
  );
}

export default function FondosPage() {
  const { userId } = useAuth();
  const { funds, loading, refresh } = useFunds(userId);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState<{ type: 'delete' | 'complete'; id: string } | null>(null);

  const active = funds.filter((f) => f.status !== 'completed');
  const completed = funds.filter((f) => f.status === 'completed');
  const filterList = (list: typeof funds) =>
    search ? list.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())) : list;

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
      toast('Fondo eliminado');
    } else {
      await getInvestmentUseCases().updateInvestment(confirm.id, { status: 'completed' });
      toast('Fondo marcado como completado');
    }
    setConfirm(null);
    refresh();
  }

  function handleExport() {
    const rows = [
      ['Fondo', 'Títulos', 'Valor título actual', 'Invertido', 'Valor actual', 'Ganancia/Pérdida', 'Ganancia %', 'Estado'],
      ...funds.map((f) => [
        f.name,
        f.totalTitles.toFixed(4),
        f.currentTitleValue.toFixed(4),
        f.totalInvested.toFixed(2),
        f.currentValue.toFixed(2),
        f.gainLoss.toFixed(2),
        f.gainLossPercent.toFixed(2) + '%',
        f.status,
      ]),
    ];
    downloadCsv('fondos-inversion.csv', rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fondos de inversión</h1>
          <p className="text-slate-500">Seguimiento de títulos y valor de mercado</p>
        </div>
        <div className="flex gap-2">
          {funds.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Exportar</Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nuevo fondo</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Nuevo fondo de inversión</DialogTitle></DialogHeader>
            {userId && <FundForm userId={userId} onSuccess={() => { setOpen(false); refresh(); toast('Fondo creado'); }} onCancel={() => setOpen(false)} />}
          </DialogContent>
        </Dialog>
        </div>
      </div>
      {/* Summary cards */}
      {funds.length > 0 && (() => {
        const totalInvested = funds.filter(f => f.status !== 'completed').reduce((s, f) => s + f.totalInvested, 0);
        const totalValue = funds.filter(f => f.status !== 'completed').reduce((s, f) => s + f.currentValue, 0);
        const totalGain = totalValue - totalInvested;
        const gainPositive = totalGain >= 0;
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total invertido</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalInvested)}</p>
                    <p className="mt-1 text-xs text-slate-400">{active.length} fondo{active.length !== 1 ? 's' : ''} activo{active.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Valor actual</p>
                    <p className="mt-2 text-2xl font-bold text-indigo-600 tabular-nums">{formatCurrency(totalValue)}</p>
                    <p className="mt-1 text-xs text-slate-400">Precio de mercado</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={gainPositive ? 'border-emerald-200' : 'border-red-200'}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ganancia / Pérdida</p>
                    <p className={`mt-2 text-2xl font-bold tabular-nums ${gainPositive ? 'text-emerald-600' : 'text-red-500'}`}>{gainPositive ? '+' : ''}{formatCurrency(totalGain)}</p>
                    <p className="mt-1 text-xs text-slate-400">{totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : '0.00'}% sobre invertido</p>
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${gainPositive ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {gainPositive ? <TrendingUp className="h-5 w-5 text-white" /> : <TrendingDown className="h-5 w-5 text-white" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {funds.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar fondo..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InvestmentCardSkeleton />
          <InvestmentCardSkeleton />
          <InvestmentCardSkeleton />
        </div>
      ) : funds.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center"><Wallet className="h-12 w-12 text-gray-300 mb-4" /><h3 className="font-semibold text-gray-600">Sin fondos</h3><p className="text-sm text-gray-400 mt-1">Agrega tu primer fondo de inversión</p></CardContent></Card>
      ) : (
        <>
          {active.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filterList(active).map((f) => <FundCard key={f.id} fund={f} onDelete={handleDelete} onRefresh={refresh} onComplete={handleComplete} />)}
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Completados ({completed.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filterList(completed).map((f) => <FundCard key={f.id} fund={f} onDelete={handleDelete} onRefresh={refresh} onComplete={handleComplete} />)}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'delete' ? '¿Eliminar fondo?' : '¿Marcar como completado?'}
        description={
          confirm?.type === 'delete'
            ? 'Esta acción no se puede deshacer. El fondo será eliminado permanentemente.'
            : 'El fondo ya no se contabilizará en los totales activos.'
        }
        confirmLabel={confirm?.type === 'delete' ? 'Eliminar' : 'Completar'}
        variant={confirm?.type === 'delete' ? 'danger' : 'default'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
