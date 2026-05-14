'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Boxes, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui/card';
import { Button } from '../../../presentation/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../presentation/components/ui/dialog';
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

function CustomCard({ investment, onDelete }: { investment: Investment; onDelete: (id: string) => void }) {
  const parsed = parseDescription(investment.description);
  return (
    <Card className="transition-shadow hover:shadow-lg cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight truncate">{investment.name}</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">
              {parsed.date ? formatDate(parsed.date) : formatDate(investment.createdAt)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-red-500 shrink-0"
            onClick={() => onDelete(investment.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Monto</span>
          <span className="font-semibold text-gray-900">{formatCurrency(parsed.amount)}</span>
        </div>
        {parsed.notes && (
          <p className="text-xs text-gray-400 italic pt-1">{parsed.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function OtrosPage() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

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
          <h1 className="text-2xl font-bold text-gray-900">Otros proyectos</h1>
          <p className="text-gray-500">Inversiones y proyectos personalizados</p>
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
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Total proyectos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{investments.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500">Monto total</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(totalAmount)}</p>
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
            <CustomCard key={inv.id} investment={inv} onDelete={setConfirmId} />
          ))}
        </div>
      )}

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
