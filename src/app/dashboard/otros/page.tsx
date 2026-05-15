'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Boxes, Trash2, DollarSign, LayoutGrid, Pencil } from 'lucide-react';
import { useFeatureFlags } from '../../../presentation/hooks/use-feature-flags';
import { SectionDisabled } from '../../../presentation/components/ui/section-disabled';
import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui/card';
import { Button } from '../../../presentation/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../presentation/components/ui/dialog';
import { Input } from '../../../presentation/components/ui/input';
import { Label } from '../../../presentation/components/ui/label';
import { ConfirmDialog } from '../../../presentation/components/ui/confirm-dialog';
import { InvestmentCardSkeleton } from '../../../presentation/components/ui/investment-card-skeleton';
import { CustomForm } from '../../../presentation/components/investments/custom-form';
import { useAuth } from '../../../presentation/hooks/use-auth';
import { useToast } from '../../../presentation/components/ui/toast-provider';
import { formatCurrency, formatDate } from '../../../presentation/lib/utils';
import { getInvestmentUseCases } from '../../../presentation/lib/di';
import { Investment } from '../../../domain/entities/investment.entity';

interface ParsedCustom {
  amount: number;
  date: string;
  notes: string;
}

function parseDescription(description?: string): ParsedCustom {
  if (!description) return { amount: 0, date: '', notes: '' };
  try {
    const parsed = JSON.parse(description);
    return {
      amount: typeof parsed.amount === 'number' ? parsed.amount : 0,
      date: typeof parsed.date === 'string' ? parsed.date : '',
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    };
  } catch {
    return { amount: 0, date: '', notes: description };
  }
}

function CustomCard({ investment, onDelete, onEdit }: { investment: Investment; onDelete: (id: string) => void; onEdit: (inv: Investment) => void }) {
  const parsed = parseDescription(investment.description);
  return (
    <Card className="transition-shadow hover:shadow-lg cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight truncate">{investment.name}</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              {parsed.date ? formatDate(parsed.date) : formatDate(investment.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600" onClick={() => onEdit(investment)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => onDelete(investment.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Monto</span>
          <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(parsed.amount)}</span>
        </div>
        {parsed.notes && (
          <p className="text-xs text-slate-400 italic pt-1">{parsed.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function OtrosPage() {
  const { isEnabled } = useFeatureFlags();
  const { userId } = useAuth();
  const { toast } = useToast();

  if (!isEnabled('section_otros')) {
    return <SectionDisabled label="Otros proyectos" />;
  }
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Investment | null>(null);
  const [editForm, setEditForm] = useState({ name: '', amount: '', date: '', notes: '' });
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const uc = getInvestmentUseCases();
      const all = await uc.getUserInvestments(userId);
      setInvestments(all.filter((i) => i.type === 'custom'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  function openEdit(inv: Investment) {
    const p = parseDescription(inv.description);
    setEditForm({ name: inv.name, amount: String(p.amount), date: p.date || new Date().toISOString().split('T')[0], notes: p.notes });
    setEditTarget(inv);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    const description = JSON.stringify({ amount: parseFloat(editForm.amount), date: editForm.date, notes: editForm.notes });
    await getInvestmentUseCases().updateInvestment(editTarget.id, { name: editForm.name, description });
    setEditSaving(false);
    setEditTarget(null);
    toast('Proyecto actualizado');
    load();
  }

  async function handleDelete() {
    if (!confirmId) return;
    await getInvestmentUseCases().deleteInvestment(confirmId);
    toast('Inversión eliminada');
    setConfirmId(null);
    load();
  }

  const totalAmount = investments.reduce((s, i) => {
    const p = parseDescription(i.description);
    return s + p.amount;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Otros proyectos</h1>
          <p className="text-slate-500">Inversiones y proyectos personalizados</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nuevo proyecto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nuevo proyecto</DialogTitle></DialogHeader>
            {userId && (
              <CustomForm
                userId={userId}
                onSuccess={() => { setNewOpen(false); load(); toast('Proyecto creado'); }}
                onCancel={() => setNewOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      {investments.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total proyectos</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{investments.length}</p>
                  <p className="mt-1 text-xs text-slate-400">proyectos registrados</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500">
                  <LayoutGrid className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Monto total</p>
                  <p className="mt-2 text-2xl font-bold text-indigo-600 tabular-nums">{formatCurrency(totalAmount)}</p>
                  <p className="mt-1 text-xs text-slate-400">suma de inversiones</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <InvestmentCardSkeleton />
          <InvestmentCardSkeleton />
          <InvestmentCardSkeleton />
        </div>
      ) : investments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Boxes className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-600">Sin proyectos</h3>
            <p className="text-sm text-gray-400 mt-1">Agrega tu primer proyecto personalizado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {investments.map((inv) => (
            <CustomCard key={inv.id} investment={inv} onDelete={setConfirmId} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar proyecto</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid gap-2">
              <Label>Nombre <span className="text-red-500">*</span></Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="grid gap-2">
              <Label>Monto (MXN) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" value={editForm.amount} onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))} required />
            </div>
            <div className="grid gap-2">
              <Label>Fecha</Label>
              <Input type="date" value={editForm.date} onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Notas (opcional)</Label>
              <Input value={editForm.notes} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Descripción libre..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
              <Button type="submit" disabled={editSaving || !editForm.name || !editForm.amount}>
                {editSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmId}
        title="¿Eliminar proyecto?"
        description="Esta acción no se puede deshacer. El proyecto será eliminado permanentemente."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
