'use client';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Wallet, TreePine, DollarSign, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Clock, PiggyBank, Activity, ChevronRight, CalendarDays, Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../presentation/components/ui/card';
import { Badge } from '../../presentation/components/ui/badge';
import dynamic from 'next/dynamic';

const ChartSkeleton = () => <div className="h-64 animate-pulse rounded-lg bg-slate-100" />;
const PortfolioChart = dynamic(() => import('../../presentation/components/charts/portfolio-chart').then((m) => ({ default: m.PortfolioChart })), { ssr: false, loading: ChartSkeleton });
const IncomeForecastChart = dynamic(() => import('../../presentation/components/charts/income-forecast-chart').then((m) => ({ default: m.IncomeForecastChart })), { ssr: false, loading: ChartSkeleton });
const PortfolioGrowthChart = dynamic(() => import('../../presentation/components/charts/portfolio-growth-chart').then((m) => ({ default: m.PortfolioGrowthChart })), { ssr: false, loading: ChartSkeleton });
import { useAuth } from '../../presentation/hooks/use-auth';
import { useDashboard } from '../../presentation/hooks/use-investments';
import { formatCurrency, calcDaysUntilExpiry } from '../../presentation/lib/utils';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Skeleton className="lg:col-span-3 h-72" />
        <Skeleton className="lg:col-span-2 h-72" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { profile, loading: authLoading, userId } = useAuth();
  const { data, loading } = useDashboard(userId);

  if (authLoading || loading) return <LoadingState />;

  const briqCapital = data?.briqSummary.totalCapital ?? 0;
  const briqMonthly = data?.briqSummary.totalMonthlyInterest ?? 0;
  const briqAnnual = data?.briqSummary.totalAnnualInterest ?? 0;
  const fundValue = data?.totalFundValue ?? 0;
  const fundInvested = data?.totalFundInvested ?? 0;
  const fundGain = data?.totalFundGain ?? 0;
  const landPaid = data?.totalLandPaid ?? 0;
  const aforeBalance = data?.totalAforeBalance ?? 0;
  const grand = data?.grandTotalInvested ?? 0;

  const activeBriqs = data?.briqs.filter((b) => b.status !== 'completed') ?? [];
  const activeFunds = data?.funds.filter((f) => f.status !== 'completed') ?? [];
  const fundGainPct = fundInvested > 0 ? (fundGain / fundInvested) * 100 : 0;
  const fundGainPositive = fundGain >= 0;

  // Allocation bar segments
  const allocationSegments = [
    { label: 'Briq', value: briqCapital, color: 'bg-violet-500' },
    { label: 'Fondos', value: fundValue, color: 'bg-sky-500' },
    { label: 'Terrenos', value: landPaid, color: 'bg-emerald-500' },
    { label: 'AFORE', value: aforeBalance, color: 'bg-amber-500' },
  ].filter((s) => s.value > 0);

  const donutData = [
    { name: 'Briq', value: briqCapital, color: '#8b5cf6' },
    { name: 'Fondos', value: fundValue, color: '#0ea5e9' },
    { name: 'Terrenos', value: landPaid, color: '#10b981' },
    { name: 'AFORE', value: aforeBalance, color: '#f59e0b' },
  ];

  // Expiry alerts
  const expiring = data?.briqs.filter((b) => {
    if (b.status === 'completed' || !b.briq.termMonths) return false;
    return calcDaysUntilExpiry(b.briq.investmentDate, b.briq.termMonths) <= 45;
  }) ?? [];

  const firstName = profile?.fullName?.split(' ')[0] ?? 'Inversionista';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-6">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-6 text-white shadow-lg shadow-indigo-900/20">
        <p className="text-sm font-medium text-indigo-200">{greeting}, {firstName}</p>
        <div className="mt-1 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-indigo-300 uppercase tracking-wider mb-1">Portafolio total</p>
            <p className="text-4xl font-bold tabular-nums">{formatCurrency(grand)}</p>
          </div>
          {grand > 0 && (
            <div className="flex gap-6">
              {briqMonthly > 0 && (
                <div className="text-right">
                  <p className="text-xs text-indigo-300">Interés mensual</p>
                  <p className="text-lg font-semibold tabular-nums">{formatCurrency(briqMonthly)}</p>
                </div>
              )}
              {briqAnnual > 0 && (
                <div className="text-right">
                  <p className="text-xs text-indigo-300">Proyección anual</p>
                  <p className="text-lg font-semibold tabular-nums">{formatCurrency(briqAnnual)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Allocation bar */}
        {grand > 0 && allocationSegments.length > 0 && (
          <div className="mt-5">
            <div className="flex h-2 w-full overflow-hidden rounded-full gap-px">
              {allocationSegments.map((s) => (
                <div
                  key={s.label}
                  className={`${s.color} transition-all`}
                  style={{ width: `${(s.value / grand) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {allocationSegments.map((s) => (
                <span key={s.label} className="flex items-center gap-1.5 text-xs text-indigo-200">
                  <span className={`inline-block h-2 w-2 rounded-full ${s.color}`} />
                  {s.label} {((s.value / grand) * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Stat cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Briq */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Capital Briq</p>
                <p className="mt-2 text-xl font-bold text-slate-900 tabular-nums">{formatCurrency(briqCapital)}</p>
                {briqMonthly > 0 && (
                  <p className="mt-1 text-xs text-indigo-600 font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />{formatCurrency(briqMonthly)}/mes
                  </p>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                <TrendingUp className="h-4 w-4 text-violet-600" />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{activeBriqs.length} inversión{activeBriqs.length !== 1 ? 'es' : ''} activa{activeBriqs.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        {/* Fondos */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Valor fondos</p>
                <p className="mt-2 text-xl font-bold text-slate-900 tabular-nums">{formatCurrency(fundValue)}</p>
                {fundInvested > 0 && (
                  <p className={`mt-1 text-xs font-medium flex items-center gap-1 ${fundGainPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {fundGainPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {fundGainPositive ? '+' : ''}{fundGainPct.toFixed(2)}% ganancia
                  </p>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100">
                <Wallet className="h-4 w-4 text-sky-600" />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{activeFunds.length} fondo{activeFunds.length !== 1 ? 's' : ''} activo{activeFunds.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        {/* Terrenos */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Terrenos</p>
                <p className="mt-2 text-xl font-bold text-slate-900 tabular-nums">{formatCurrency(landPaid)}</p>
                <p className="mt-1 text-xs text-slate-400">pagado hasta hoy</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <TreePine className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{data?.lands.length ?? 0} terreno{(data?.lands.length ?? 0) !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        {/* AFORE */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">AFORE</p>
                <p className="mt-2 text-xl font-bold text-slate-900 tabular-nums">{aforeBalance > 0 ? formatCurrency(aforeBalance) : '—'}</p>
                {aforeBalance > 0 && (
                  <p className="mt-1 text-xs text-slate-400">saldo total</p>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <PiggyBank className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{data?.afores.length ?? 0} cuenta{(data?.afores.length ?? 0) !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Growth chart + Donut ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              Evolución del portafolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioGrowthChart
              briqs={data?.briqs ?? []}
              funds={data?.funds ?? []}
              lands={data?.lands ?? []}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-400" />
              Distribución
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioChart data={donutData} />
          </CardContent>
        </Card>
      </div>

      {/* ── Income forecast ────────────────────────────────────── */}
      {activeBriqs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                Proyección de ingresos — próximos 12 meses
              </CardTitle>
              <div className="text-right">
                <p className="text-xs text-slate-400">Interés mensual actual</p>
                <p className="text-base font-bold text-indigo-600 tabular-nums">{formatCurrency(briqMonthly)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <IncomeForecastChart briqs={data?.briqs ?? []} />
            <p className="text-[11px] text-slate-400 mt-2">Barra más oscura = mes actual. Bars más claras = meses futuros. Barras que bajan = Briqs que vencen.</p>
          </CardContent>
        </Card>
      )}

      {/* ── Expiry alerts ──────────────────────────────────────── */}
      {expiring.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Inversiones próximas a vencer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-amber-100">
              {expiring.map((b) => {
                const days = calcDaysUntilExpiry(b.briq.investmentDate, b.briq.termMonths!);
                return (
                  <div key={b.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium text-slate-900">{b.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 tabular-nums">{formatCurrency(b.briq.investedAmount)}</span>
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
      )}

      {/* ── Briq active table ──────────────────────────────────── */}
      {activeBriqs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                Inversiones Briq activas
              </CardTitle>
              <Link href="/dashboard/briq" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                Ver todas <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">Proyecto</th>
                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Capital</th>
                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Tasa</th>
                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Mensual</th>
                    <th className="text-right text-xs font-semibold text-slate-500 px-4 py-2.5">Anual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeBriqs.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-[180px] truncate">{b.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatCurrency(b.briq.investedAmount)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                          <ArrowUpRight className="h-3 w-3" />{b.briq.annualInterestRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-indigo-600 font-semibold">{formatCurrency(b.monthlyInterest)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-semibold">{formatCurrency(b.annualInterest)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">Total</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">{formatCurrency(briqCapital)}</td>
                    <td />
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-indigo-600">{formatCurrency(briqMonthly)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-600">{formatCurrency(briqAnnual)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Fund performance row ───────────────────────────────── */}
      {activeFunds.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Wallet className="h-4 w-4 text-sky-500" />
                Fondos de inversión
              </CardTitle>
              <Link href="/dashboard/fondos" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                Ver todos <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {activeFunds.map((f) => {
                const pos = f.gainLoss >= 0;
                return (
                  <div key={f.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{f.name}</p>
                      <p className="text-xs text-slate-400">{f.totalTitles.toFixed(2)} títulos · ${f.currentTitleValue.toFixed(4)}/título</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(f.currentValue)}</p>
                      <p className={`text-xs font-medium flex items-center justify-end gap-0.5 ${pos ? 'text-emerald-600' : 'text-red-500'}`}>
                        {pos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {pos ? '+' : ''}{f.gainLossPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {activeFunds.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total fondos</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(fundValue)}</span>
                  <span className={`ml-3 text-xs font-semibold ${fundGainPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {fundGainPositive ? '+' : ''}{formatCurrency(fundGain)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Land summary row ───────────────────────────────────── */}
      {(data?.lands.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <TreePine className="h-4 w-4 text-emerald-500" />
                Terrenos
              </CardTitle>
              <Link href="/dashboard/terrenos" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                Ver todos <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {data!.lands.map((l) => {
                const pct = l.details.totalPrice > 0 ? (l.totalPaid / l.details.totalPrice) * 100 : 0;
                return (
                  <div key={l.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-slate-900">{l.name}</p>
                      <p className="text-sm font-bold tabular-nums text-slate-900">{formatCurrency(l.totalPaid)} <span className="font-normal text-slate-400 text-xs">/ {formatCurrency(l.details.totalPrice)}</span></p>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{pct.toFixed(1)}% pagado</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Empty state ────────────────────────────────────────── */}
      {grand === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <DollarSign className="h-12 w-12 text-slate-200 mb-4" />
            <h3 className="font-semibold text-slate-600">Portafolio vacío</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">Comienza agregando tu primera inversión en Briq, Fondos, Terrenos o AFORE.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
