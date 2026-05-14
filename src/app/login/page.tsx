'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Eye, EyeOff, TrendingUp, ShieldCheck, BarChart3 } from 'lucide-react';

const features = [
  { icon: TrendingUp,  text: 'Proyección de interés en tiempo real' },
  { icon: BarChart3,   text: 'Gráficas de rendimiento histórico' },
  { icon: ShieldCheck, text: 'Tus datos seguros con Supabase RLS' },
];
import { createClient } from '../../infrastructure/supabase/client';
import { Button } from '../../presentation/components/ui/button';
import { Input } from '../../presentation/components/ui/input';
import { Label } from '../../presentation/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      const msg = err.message.toLowerCase().includes('email')
        ? 'Confirma tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.'
        : 'Correo o contraseña incorrectos';
      setError(msg);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F4F6FB]">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
           style={{ background: 'linear-gradient(145deg, #1a0533 0%, #0f0b2e 45%, #0a1a3e 100%)' }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
             style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
             style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full opacity-15 blur-3xl pointer-events-none"
             style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/50">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">InversionTracker</span>
        </div>

        {/* Hero */}
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">Portafolio inteligente</p>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Controla tus inversiones<br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h1>
          <p className="text-white/50 text-[15px] leading-relaxed max-w-xs mb-10">
            Briq, fondos, terrenos y más — visualiza tu portafolio y proyecta tus rendimientos en tiempo real.
          </p>
          <ul className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] border border-white/10">
                  <Icon className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <span className="text-sm text-white/60">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-white/25 text-xs">© {new Date().getFullYear()} InversionTracker</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">InversionTracker</span>
          </div>

          {/* Form card */}
          <div className="rounded-2xl bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04),_0_12px_40px_rgba(0,0,0,0.08)] p-8">
            <div className="mb-7">
              <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Bienvenido de vuelta</h2>
              <p className="mt-1 text-sm text-slate-500">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Correo electrónico</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email" placeholder="tu@correo.com" className="h-10" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Contraseña</Label>
                  <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                    placeholder="••••••••" className="h-10 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-10 mt-1" disabled={loading}>
                {loading
                  ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Ingresando...</span>
                  : 'Iniciar sesión'}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
