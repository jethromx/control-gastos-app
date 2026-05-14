'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { createClient } from '../../infrastructure/supabase/client';
import { Button } from '../../presentation/components/ui/button';
import { Input } from '../../presentation/components/ui/input';
import { Label } from '../../presentation/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../presentation/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName } },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      // If session exists immediately, email confirmation is disabled — go straight to dashboard
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      } else {
        setEmailSent(true);
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">InversionTracker</span>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>Regístrate para comenzar</CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="space-y-4 text-center py-4">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                </div>
                <h3 className="font-semibold text-gray-900">Revisa tu correo</h3>
                <p className="text-sm text-gray-500">
                  Enviamos un enlace de confirmación a <strong>{form.email}</strong>. Haz clic en el enlace para activar tu cuenta.
                </p>
                <p className="text-xs text-gray-400 pt-2">
                  ¿Ya confirmaste?{' '}
                  <Link href="/login" className="text-indigo-600 hover:underline">Inicia sesión</Link>
                </p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
              )}
              <div className="grid gap-2">
                <Label>Nombre completo</Label>
                <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required placeholder="Juan Pérez" />
              </div>
              <div className="grid gap-2">
                <Label>Correo electrónico</Label>
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="tu@correo.com" />
              </div>
              <div className="grid gap-2">
                <Label>Contraseña</Label>
                <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="grid gap-2">
                <Label>Confirmar contraseña</Label>
                <Input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required placeholder="Repite tu contraseña" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
              <p className="text-center text-sm text-gray-500">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-indigo-600 hover:underline font-medium">Inicia sesión</Link>
              </p>
            </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
