'use client';
import { useState } from 'react';
import { Plus, TrendingUp, ArrowUpRight, Trash2, Pencil, CheckCircle, Search, Download, AlertTriangle, Clock, Square, CheckSquare, LayoutGrid, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui/card';
import { Button } from '../../../presentation/components/ui/button';
import { Badge } from '../../../presentation/components/ui/badge';
import { Input } from '../../../presentation/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../presentation/components/ui/dialog';
import { ConfirmDialog } from '../../../presentation/components/ui/confirm-dialog';
import { InvestmentCardSkeleton } from '../../../presentation/components/ui/investment-card-skeleton';
import { BriqChart } from '../../../presentation/components/charts/briq-chart';
import { BriqProjectionChart } from '../../../presentation/components/charts/briq-projection-chart';
import { BriqForm } from '../../../presentation/components/investments/briq-form';
import { BriqEditForm } from '../../../presentation/components/investments/briq-edit-form';
import { BriqImportButton } from '../../../presentation/components/investments/briq-import';
import { useAuth } from '../../../presentation/hooks/use-auth';
import { useBriqs } from '../../../presentation/hooks/use-investments';
import { useToast } from '../../../presentation/components/ui/toast-provider';
import { formatCurrency, formatDate, calcDaysUntilExpiry } from '../../../presentation/lib/utils';
import { downloadCsv } from '../../../presentation/lib/export';
import { getInvestmentUseCases } from '../../../presentation/lib/di';
import { BriqInvestmentWithDetails } from '../../../domain/entities/investment.entity';

function ExpiryBadge({ investmentDate, termMonths }: { investmentDate: Date; termMonths: number }) {
  const days = calcDaysUntilExpiry(investmentDate, termMonths);
  if (days < 0) return <Badge variant="destructive" className="flex items-center gap-1 text-xs"><AlertTriangle className="h-3 w-3" />Vencida</Badge>;
  if (days <= 14) return <Badge variant="destructive" className="flex items-center gap-1 text-xs"><AlertTriangle className="h-3 w-3" />Vence en {days}d</Badge>;
  if (days <= 30) return <Badge variant="warning" className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3" />Vence en {days}d</Badge>;
  return null;
}

function BriqCard({ b, onDelete, onEdit, onComplete, selected, onToggleSelect }: {
  b: BriqInvestmentWithDetails;
  onDelete: (id: string) => void;
  onEdit: (b: BriqInvestmentWithDetails) => void;
  onComplete: (id: string) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const isCompleted = b.status === 'completed';
  return (
    <Card className={`relative transition-all cursor-pointer ${isCompleted ? 'opacity-60' : 'hover:shadow-lg'} ${selected ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}>
      {/* Checkbox overlay */}
      <button
        onClick={() => onToggleSelect(b.id)}
        className="absolute top-3 left-3 z-10 rounded-md p-0.5 transition-colors hover:bg-slate-100"
        title={selected ? 'Deseleccionar' : 'Seleccionar'}
      >
        {selected
          ? <CheckSquare className="h-4 w-4 text-indigo-600" />
          : <Square className="h-4 w-4 text-slate-300 hover:text-slate-500" />}
      </button>

      <CardHeader className="pb-3 pl-9">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight truncate">{b.name}</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(b.briq.investmentDate)}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isCompleted && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600" onClick={() => onEdit(b)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-600" title="Marcar como completada" onClick={() => onComplete(b.id)}>
                  <CheckCircle className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-500" onClick={() => onDelete(b.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {isCompleted && <Badge variant="secondary" className="w-fit text-xs">Completada</Badge>}
        {!isCompleted && b.briq.termMonths && (
          <div className="mt-1">
            <ExpiryBadge investmentDate={b.briq.investmentDate} termMonths={b.briq.termMonths} />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Capital</span>
          <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(b.briq.investedAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Tasa anual</span>
          <Badge variant="success" className="flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" />{b.briq.annualInterestRate}%
          </Badge>
        </div>
        <div className="h-px bg-slate-100" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Interés mensual</span>
          <span className="font-semibold text-indigo-600 tabular-nums">{formatCurrency(b.monthlyInterest)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Interés anual</span>
          <span className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(b.annualInterest)}</span>
        </div>
        {b.briq.termMonths && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Plazo</span>
            <span className="text-xs text-slate-700">{b.briq.termMonths} meses</span>
          </div>
        )}
        {b.description && (
          <p className="text-xs text-slate-400 italic pt-1">{b.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function BriqPage() {
  const { userId } = useAuth();
  const { briqs, loading, refresh } = useBriqs(userId);
  const { toast } = useToast();
  const [newOpen, setNewOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BriqInvestmentWithDetails | null>(null);
  const [search, setSearch] = useState('');
  const [chartMode, setChartMode] = useState<'capital' | 'interest'>('capital');
  const [confirm, setConfirm] = useState<{ type: 'delete' | 'complete'; id: string } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const active = briqs.filter((b) => b.status !== 'completed');
  const completed = briqs.filter((b) => b.status === 'completed');

  const filtered = (list: BriqInvestmentWithDetails[]) =>
    search ? list.filter((b) => b.name.toLowerCase().includes(search.toLowerCase())) : list;

  const totalCapital = active.reduce((s, b) => s + b.briq.investedAmount, 0);
  const totalMonthly = active.reduce((s, b) => s + b.monthlyInterest, 0);
  const totalAnnual = active.reduce((s, b) => s + b.annualInterest, 0);

  function handleExport() {
    const rows = [
      ['Proyecto', 'Capital', 'Tasa anual %', 'Interés mensual', 'Interés anual', 'Fecha', 'Plazo (meses)', 'Estado'],
      ...briqs.map((b) => [
        b.name,
        b.briq.investedAmount.toString(),
        b.briq.annualInterestRate.toString(),
        b.monthlyInterest.toFixed(2),
        b.annualInterest.toFixed(2),
        formatDate(b.briq.investmentDate),
        b.briq.termMonths?.toString() ?? '',
        b.status,
      ]),
    ];
    downloadCsv('inversiones-briq.csv', rows);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(briqs.map((b) => b.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

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
      setSelected((prev) => { const n = new Set(prev); n.delete(confirm.id); return n; });
      toast('Inversión eliminada');
    } else {
      await getInvestmentUseCases().completeBriqInvestment(confirm.id);
      toast('Inversión marcada como completada');
    }
    setConfirm(null);
    refresh();
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    const uc = getInvestmentUseCases();
    await Promise.all([...selected].map((id) => uc.deleteInvestment(id)));
    const count = selected.size;
    clearSelection();
    setBulkConfirm(false);
    setBulkDeleting(false);
    refresh();
    toast(`${count} inversión${count !== 1 ? 'es' : ''} eliminada${count !== 1 ? 's' : ''}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inversiones Briq</h1>
          <p className="text-slate-500">Proyectos de inversión con tasa de interés fija</p>
        </div>
        <div className="flex gap-2">
          {briqs.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Exportar</Button>
          )}
          {userId && <BriqImportButton userId={userId} onImported={refresh} />}
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nueva inversión</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Nueva inversión Briq</DialogTitle></DialogHeader>
            {userId && (
              <BriqForm userId={userId} onSuccess={() => { setNewOpen(false); refresh(); toast('Inversión creada'); }} onCancel={() => setNewOpen(false)} />
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Capital activo</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalCapital)}</p>
                <p className="mt-1 text-xs text-slate-400">{active.length} inversión{active.length !== 1 ? 'es' : ''} activa{active.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Interés mensual</p>
                <p className="mt-2 text-2xl font-bold text-indigo-600 tabular-nums">{formatCurrency(totalMonthly)}</p>
                <p className="mt-1 text-xs text-slate-400">Proyectado este mes</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                <ArrowUpRight className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Interés anual</p>
                <p className="mt-2 text-2xl font-bold text-green-600 tabular-nums">{formatCurrency(totalAnnual)}</p>
                <p className="mt-1 text-xs text-slate-400">Proyectado este año</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {active.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Comparativa por proyecto</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant={chartMode === 'capital' ? 'default' : 'outline'} onClick={() => setChartMode('capital')}>Capital</Button>
                <Button size="sm" variant={chartMode === 'interest' ? 'default' : 'outline'} onClick={() => setChartMode('interest')}>Interés anual</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent><BriqChart briqs={briqs} mode={chartMode} /></CardContent>
        </Card>
      )}

      {/* Projection chart */}
      {active.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proyección de interés — próximos 12 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <BriqProjectionChart briqs={briqs} />
          </CardContent>
        </Card>
      )}

      {/* Search + selection toolbar */}
      {briqs.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Buscar proyecto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* View toggle */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'card' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              title="Vista tarjetas"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
              title="Vista tabla"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
          </div>

          {/* Selection controls */}
          {selected.size === 0 ? (
            <Button variant="outline" size="sm" onClick={selectAll} className="text-slate-500">
              <CheckSquare className="h-4 w-4 mr-1.5" />Seleccionar todos
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5">
              <span className="text-sm font-medium text-indigo-700 tabular-nums">
                {selected.size} seleccionada{selected.size !== 1 ? 's' : ''}
              </span>
              <div className="w-px h-4 bg-indigo-200" />
              <button onClick={selectAll} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                Todas ({briqs.length})
              </button>
              <button onClick={clearSelection} className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                Limpiar
              </button>
              <div className="w-px h-4 bg-indigo-200" />
              <button
                onClick={() => setBulkConfirm(true)}
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar {selected.size}
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InvestmentCardSkeleton />
          <InvestmentCardSkeleton />
          <InvestmentCardSkeleton />
        </div>
      ) : briqs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-600">Sin inversiones</h3>
            <p className="text-sm text-gray-400 mt-1">Agrega tu primera inversión Briq</p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 w-8">
                    <button onClick={selected.size === briqs.length ? clearSelection : selectAll}>
                      {selected.size === briqs.length
                        ? <CheckSquare className="h-4 w-4 text-indigo-600" />
                        : <Square className="h-4 w-4 text-slate-300" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Proyecto</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-500">Capital</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-500">Tasa</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-500">Int. mensual</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-500">Int. anual</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-500">Fecha</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-500">Plazo</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-500">Estado</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...filtered(active), ...filtered(completed)].map((b) => {
                  const isCompleted = b.status === 'completed';
                  return (
                    <tr key={b.id} className={`transition-colors ${selected.has(b.id) ? 'bg-indigo-50/60' : isCompleted ? 'opacity-60 bg-white' : 'bg-white hover:bg-slate-50/60'}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(b.id)}>
                          {selected.has(b.id)
                            ? <CheckSquare className="h-4 w-4 text-indigo-600" />
                            : <Square className="h-4 w-4 text-slate-300 hover:text-slate-500" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 leading-tight">{b.name}</div>
                        {!isCompleted && b.briq.termMonths && (
                          <ExpiryBadge investmentDate={b.briq.investmentDate} termMonths={b.briq.termMonths} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{formatCurrency(b.briq.investedAmount)}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="success" className="inline-flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" />{b.briq.annualInterestRate}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-indigo-600 font-semibold">{formatCurrency(b.monthlyInterest)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-semibold">{formatCurrency(b.annualInterest)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(b.briq.investmentDate)}</td>
                      <td className="px-4 py-3 text-center text-xs text-slate-500">{b.briq.termMonths ? `${b.briq.termMonths} m` : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {isCompleted
                          ? <Badge variant="secondary">Completada</Badge>
                          : <Badge variant="success">Activa</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {!isCompleted && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600" onClick={() => setEditTarget(b)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-600" title="Marcar como completada" onClick={() => handleComplete(b.id)}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-500" onClick={() => handleDelete(b.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered(active).map((b) => (
                <BriqCard key={b.id} b={b} onDelete={handleDelete} onEdit={setEditTarget} onComplete={handleComplete} selected={selected.has(b.id)} onToggleSelect={toggleSelect} />
              ))}
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Completadas ({completed.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered(completed).map((b) => (
                  <BriqCard key={b.id} b={b} onDelete={handleDelete} onEdit={setEditTarget} onComplete={handleComplete} selected={selected.has(b.id)} onToggleSelect={toggleSelect} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Editar inversión Briq</DialogTitle></DialogHeader>
          {editTarget && (
            <BriqEditForm
              investment={editTarget}
              onSuccess={() => { setEditTarget(null); refresh(); toast('Inversión actualizada'); }}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Single confirm dialog */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === 'delete' ? '¿Eliminar inversión?' : '¿Marcar como completada?'}
        description={
          confirm?.type === 'delete'
            ? 'Esta acción no se puede deshacer. La inversión será eliminada permanentemente.'
            : 'La inversión ya no se contabilizará en los totales activos.'
        }
        confirmLabel={confirm?.type === 'delete' ? 'Eliminar' : 'Completar'}
        variant={confirm?.type === 'delete' ? 'danger' : 'default'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />

      {/* Bulk delete confirm dialog */}
      <ConfirmDialog
        open={bulkConfirm}
        title={`¿Eliminar ${selected.size} inversión${selected.size !== 1 ? 'es' : ''}?`}
        description={`Se eliminarán permanentemente ${selected.size} inversión${selected.size !== 1 ? 'es' : ''} seleccionada${selected.size !== 1 ? 's' : ''}. Esta acción no se puede deshacer.`}
        confirmLabel={bulkDeleting ? 'Eliminando...' : `Eliminar ${selected.size}`}
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkConfirm(false)}
      />
    </div>
  );
}
