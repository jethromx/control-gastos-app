'use client';
import { TrendingUp, Wallet, TreePine, DollarSign, ArrowUpRight, CalendarDays, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../presentation/components/ui/card';
import { Badge } from '../../presentation/components/ui/badge';
import { PortfolioChart } from '../../presentation/components/charts/portfolio-chart';
import { MonthlyInterestChart } from '../../presentation/components/charts/monthly-interest-chart';
import { useAuth } from '../../presentation/hooks/use-auth';
import { useDashboard } from '../../presentation/hooks/use-investments';
import { formatCurrency, calcDaysUntilExpiry } from '../../presentation/lib/utils';

function StatCard({ title, value, sub, icon: Icon, accent }: {
  title: string; value: string; sub?: string; icon: React.ElementType; accent: string;
}) {
  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
            {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { profile, loading: authLoading, userId } = useAuth();
  const { data, loading } = useDashboard(userId);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const briqCapital = data?.briqSummary.totalCapital ?? 0;
  const briqMonthly = data?.briqSummary.totalMonthlyInterest ?? 0;
  const briqAnnual = data?.briqSummary.totalAnnualInterest ?? 0;
  const fundValue = data?.totalFundValue ?? 0;
  const fundInvested = data?.totalFundInvested ?? 0;
  const landPaid = data?.totalLandPaid ?? 0;
  const grand = data?.grandTotalInvested ?? 0;

  const chartData = [
    { name: 'Briq', value: briqCapital, color: '#6366f1' },
    { name: 'Fondos', value: fundValue, color: '#0ea5e9' },
    { name: 'Terrenos', value: landPaid, color: '#10b981' },
  ];

  const currentMonth = new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hola, {profile?.fullName?.split(' ')[0] ?? 'Inversionista'} 👋
        </h1>
        <p className="text-slate-500 mt-0.5">Resumen de tu portafolio de inversiones</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total invertido" value={formatCurrency(grand)} icon={DollarSign} accent="bg-indigo-500" />
        <StatCard
          title="Capital Briq"
          value={formatCurrency(briqCapital)}
          sub={`Interés mensual: ${formatCurrency(briqMonthly)}`}
          icon={TrendingUp}
          accent="bg-violet-500"
        />
        <StatCard
          title="Valor fondos"
          value={formatCurrency(fundValue)}
          sub={`Invertido: ${formatCurrency(fundInvested)}`}
          icon={Wallet}
          accent="bg-sky-500"
        />
        <StatCard title="Pagado terrenos" value={formatCurrency(landPaid)} icon={TreePine} accent="bg-emerald-500" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Distribución del portafolio</CardTitle></CardHeader>
          <CardContent><PortfolioChart data={chartData} /></CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-indigo-600" />
              Interés mensual proyectado (Briq)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyInterestChart briqs={data?.briqs ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* Proyección anual */}
      {briqAnnual > 0 && (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-indigo-200">Interés anual proyectado (Briq)</p>
                <p className="text-3xl font-bold text-white mt-1 tabular-nums">{formatCurrency(briqAnnual)}</p>
                <p className="text-xs text-indigo-300 mt-1">Basado en {data?.briqs.filter(b => b.status !== 'completed').length} inversiones activas</p>
              </div>
              <div className="flex gap-8">
                <div>
                  <p className="text-xs font-medium text-indigo-300 uppercase tracking-wide">Mensual</p>
                  <p className="text-xl font-bold text-white mt-1 tabular-nums">{formatCurrency(briqMonthly)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-300 uppercase tracking-wide">Diario est.</p>
                  <p className="text-xl font-bold text-white mt-1 tabular-nums">{formatCurrency(briqAnnual / 365)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen mensual */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-indigo-100 bg-indigo-50/60">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-indigo-500 uppercase tracking-wider">Este mes</p>
            <p className="text-2xl font-bold text-indigo-700 mt-2 tabular-nums">{formatCurrency(briqMonthly)}</p>
            <p className="text-xs text-indigo-400 mt-1">Interés Briq proyectado</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-emerald-50/60">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Este año</p>
            <p className="text-2xl font-bold text-emerald-700 mt-2 tabular-nums">{formatCurrency(briqAnnual)}</p>
            <p className="text-xs text-emerald-400 mt-1">Interés Briq proyectado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Portafolio total</p>
            <p className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">{formatCurrency(grand)}</p>
            <p className="text-xs text-slate-400 mt-1">Briq + Fondos + Terrenos</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de vencimiento */}
      {(() => {
        const expiring = data?.briqs.filter((b) => {
          if (b.status === 'completed' || !b.briq.termMonths) return false;
          const days = calcDaysUntilExpiry(b.briq.investmentDate, b.briq.termMonths);
          return days <= 30;
        }) ?? [];
        if (expiring.length === 0) return null;
        return (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" /> Inversiones próximas a vencer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expiring.map((b) => {
                  const days = calcDaysUntilExpiry(b.briq.investmentDate, b.briq.termMonths!);
                  return (
                    <div key={b.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">{b.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600">{formatCurrency(b.briq.investedAmount)}</span>
                        {days < 0
                          ? <Badge variant="destructive">Vencida</Badge>
                          : days <= 14
                          ? <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Vence en {days}d</Badge>
                          : <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" />Vence en {days}d</Badge>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Briq summary table */}
      {(data?.briqs.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" /> Inversiones Briq activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="pb-2 font-medium">Proyecto</th>
                    <th className="pb-2 font-medium text-right">Capital</th>
                    <th className="pb-2 font-medium text-right">Tasa</th>
                    <th className="pb-2 font-medium text-right">Mensual</th>
                    <th className="pb-2 font-medium text-right">Anual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.briqs.filter(b => b.status !== 'completed').map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-2 font-medium text-slate-900 max-w-[200px] truncate">{b.name}</td>
                      <td className="py-2 text-right">{formatCurrency(b.briq.investedAmount)}</td>
                      <td className="py-2 text-right">
                        <span className="flex items-center justify-end gap-1 text-green-600">
                          <ArrowUpRight className="h-3 w-3" />{b.briq.annualInterestRate}%
                        </span>
                      </td>
                      <td className="py-2 text-right text-indigo-600 font-medium">{formatCurrency(b.monthlyInterest)}</td>
                      <td className="py-2 text-right text-green-600 font-medium">{formatCurrency(b.annualInterest)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200">
                  <tr>
                    <td className="pt-2 font-semibold">Total</td>
                    <td className="pt-2 text-right font-semibold">{formatCurrency(briqCapital)}</td>
                    <td />
                    <td className="pt-2 text-right font-semibold text-indigo-600">{formatCurrency(briqMonthly)}</td>
                    <td className="pt-2 text-right font-semibold text-green-600">{formatCurrency(briqAnnual)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
