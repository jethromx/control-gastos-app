'use client';
import { useState } from 'react';
import { Plus, TrendingUp, ArrowUpRight, Trash2, Pencil, CheckCircle, Search, Download, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui/card';
import { Button } from '../../../presentation/components/ui/button';
import { Badge } from '../../../presentation/components/ui/badge';
import { Input } from '../../../presentation/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../presentation/components/ui/dialog';
import { ConfirmDialog } from '../../../presentation/components/ui/confirm-dialog';
import { InvestmentCardSkeleton } from '../../../presentation/components/ui/investment-card-skeleton';
import { BriqChart } from '../../../presentation/components/charts/briq-chart';
import { BriqForm } from '../../../presentation/components/investments/briq-form';
import { BriqEditForm } from '../../../presentation/components/investments/briq-edit-form';
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

function BriqCard({ b, onDelete, onEdit, onComplete }: {
  b: BriqInvestmentWithDetails;
  onDelete: (id: string) => void;
  onEdit: (b: BriqInvestmentWithDetails) => void;
  onComplete: (id: string) => void;
}) {
  const isCompleted = b.status === 'completed';
  return (
    <Card className={`transition-shadow cursor-pointer ${isCompleted ? 'opacity-60' : 'hover:shadow-lg'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight truncate">{b.name}</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(b.briq.investmentDate)}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isCompleted && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600" onClick={() => onEdit(b)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-green-600" title="Marcar como completada" onClick={() => onComplete(b.id)}>
                  <CheckCircle className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={() => onDelete(b.id)}>
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
          <span className="text-xs text-gray-500">Capital</span>
          <span className="font-semibold text-gray-900">{formatCurrency(b.briq.investedAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Tasa anual</span>
          <Badge variant="success" className="flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" />{b.briq.annualInterestRate}%
          </Badge>
        </div>
        <div className="h-px bg-gray-100" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Interés mensual</span>
          <span className="font-semibold text-indigo-600">{formatCurrency(b.monthlyInterest)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Interés anual</span>
          <span className="font-semibold text-green-600">{formatCurrency(b.annualInterest)}</span>
        </div>
        {b.briq.termMonths && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Plazo</span>
            <span className="text-xs text-gray-700">{b.briq.termMonths} meses</span>
          </div>
        )}
        {b.description && (
          <p className="text-xs text-gray-400 italic pt-1">{b.description}</p>
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
      toast('Inversión eliminada');
    } else {
      await getInvestmentUseCases().completeBriqInvestment(confirm.id);
      toast('Inversión marcada como completada');
    }
    setConfirm(null);
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inversiones Briq</h1>
          <p className="text-gray-500">Proyectos de inversión con tasa de interés fija</p>
        </div>
        <div className="flex gap-2">
          {briqs.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-2" />Exportar</Button>
          )}
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
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Capital activo</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalCapital)}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Interés mensual</p><p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(totalMonthly)}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Interés anual</p><p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalAnnual)}</p></CardContent></Card>
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

      {/* Search */}
      {briqs.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar proyecto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
      ) : (
        <>
          {active.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered(active).map((b) => (
                <BriqCard key={b.id} b={b} onDelete={handleDelete} onEdit={setEditTarget} onComplete={handleComplete} />
              ))}
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Completadas ({completed.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered(completed).map((b) => (
                  <BriqCard key={b.id} b={b} onDelete={handleDelete} onEdit={setEditTarget} onComplete={handleComplete} />
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

      {/* Confirm dialog */}
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
    </div>
  );
}
