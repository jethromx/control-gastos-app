'use client';
import { useState, useEffect } from 'react';
import { User, Lock, Save, Mail, ShieldCheck, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui/card';
import { Button } from '../../../presentation/components/ui/button';
import { Input } from '../../../presentation/components/ui/input';
import { Label } from '../../../presentation/components/ui/label';
import { useAuth } from '../../../presentation/hooks/use-auth';
import { getUserRepository } from '../../../presentation/lib/di';
import { createClient } from '../../../infrastructure/supabase/client';

export default function PerfilPage() {
  const { profile, supabaseUser, loading } = useAuth();
  const [nameForm, setNameForm] = useState({ fullName: '' });
  const [pwForm, setPwForm] = useState({ newPw: '', confirm: '' });
  const [nameSaving, setNameSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) setNameForm({ fullName: profile.fullName });
  }, [profile]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setNameSaving(true); setNameMsg(null);
    try {
      const repo = getUserRepository();
      await repo.update(profile.id, { fullName: nameForm.fullName });
      setNameMsg({ type: 'success', text: 'Nombre actualizado correctamente' });
    } catch {
      setNameMsg({ type: 'error', text: 'Error al actualizar el nombre' });
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    setPwSaving(true); setPwMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
      if (error) throw error;
      setPwMsg({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setPwForm({ newPw: '', confirm: '' });
    } catch {
      setPwMsg({ type: 'error', text: 'Error al cambiar la contraseña' });
    } finally {
      setPwSaving(false);
    }
  }

  const initials = profile?.fullName
    ? profile.fullName.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
        <p className="text-slate-500">Administra tu información personal y seguridad</p>
      </div>

      {/* Avatar hero card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-3xl font-bold shadow-lg shadow-indigo-200">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white border-2 border-slate-100 shadow-sm">
                <Camera className="h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{profile?.fullName}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{supabaseUser?.email}</p>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  profile?.role === 'admin'
                    ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'
                    : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                }`}>
                  <ShieldCheck className="h-3 w-3" />
                  {profile?.role === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-0.5">Nombre completo</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{profile?.fullName ?? '—'}</p>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <p className="text-xs text-slate-400 mb-0.5">Correo electrónico</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{supabaseUser?.email ?? '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout for forms */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Change name */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
              Información personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveName} className="space-y-5">
              {nameMsg && (
                <div className={`rounded-xl px-4 py-3 text-sm ${
                  nameMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}>
                  {nameMsg.text}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  value={nameForm.fullName}
                  onChange={(e) => setNameForm({ fullName: e.target.value })}
                  required
                  placeholder="Tu nombre completo"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  value={supabaseUser?.email ?? ''}
                  disabled
                  className="bg-slate-50 text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400">El correo no se puede cambiar</p>
              </div>
              <Button type="submit" disabled={nameSaving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {nameSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                <Lock className="h-4 w-4 text-violet-600" />
              </div>
              Cambiar contraseña
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-5">
              {pwMsg && (
                <div className={`rounded-xl px-4 py-3 text-sm ${
                  pwMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}>
                  {pwMsg.text}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="newPw">Nueva contraseña</Label>
                <Input
                  id="newPw"
                  type="password"
                  value={pwForm.newPw}
                  onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmar contraseña</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                  required
                  placeholder="Repite la nueva contraseña"
                />
              </div>

              {/* Password strength hint */}
              {pwForm.newPw.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        pwForm.newPw.length >= i * 3
                          ? i <= 1 ? 'bg-rose-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-indigo-400' : 'bg-emerald-500'
                          : 'bg-slate-100'
                      }`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    {pwForm.newPw.length < 6 ? 'Muy corta' : pwForm.newPw.length < 9 ? 'Débil' : pwForm.newPw.length < 12 ? 'Buena' : 'Fuerte'}
                  </p>
                </div>
              )}

              <Button type="submit" disabled={pwSaving} variant="outline" className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                {pwSaving ? 'Actualizando...' : 'Cambiar contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
