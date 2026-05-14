'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Building2, ArrowLeft } from 'lucide-react';
import { createClient } from '../../infrastructure/supabase/client';
import { Button } from '../../presentation/components/ui/button';
import { Input } from '../../presentation/components/ui/input';
import { Label } from '../../presentation/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../presentation/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setSent(true);
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
            <CardTitle>Recuperar contraseña</CardTitle>
            <CardDescription>Te enviaremos un enlace para restablecer tu contraseña</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center py-2">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Enviamos un enlace a <strong>{email}</strong>. Revisa tu bandeja de entrada y sigue las instrucciones.</p>
                <Link href="/login" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                  <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
                <div className="grid gap-2">
                  <Label>Correo electrónico</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@correo.com" autoComplete="email" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </Button>
                <p className="text-center">
                  <Link href="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600">
                    <ArrowLeft className="h-3 w-3" /> Volver al inicio de sesión
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
