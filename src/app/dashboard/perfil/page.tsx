'use client';
import { useState, useEffect } from 'react';
import { User, Lock, Save } from 'lucide-react';
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
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
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
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch {
      setPwMsg({ type: 'error', text: 'Error al cambiar la contraseña' });
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
        <p className="text-slate-500">Administra tu información personal</p>
      </div>

      {/* Avatar + info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-2xl font-bold shrink-0">
              {profile?.fullName?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{profile?.fullName}</p>
              <p className="text-sm text-slate-500">{supabaseUser?.email}</p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${profile?.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-slate-600'}`}>
                {profile?.role === 'admin' ? 'Administrador' : 'Usuario'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Información personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveName} className="space-y-4">
            {nameMsg && (
              <div className={`rounded-lg p-3 text-sm ${nameMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {nameMsg.text}
              </div>
            )}
            <div className="grid gap-2">
              <Label>Nombre completo</Label>
              <Input value={nameForm.fullName} onChange={(e) => setNameForm({ fullName: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label>Correo electrónico</Label>
              <Input value={supabaseUser?.email ?? ''} disabled className="bg-gray-50 text-slate-500" />
              <p className="text-xs text-slate-400">El correo no se puede cambiar desde aquí</p>
            </div>
            <Button type="submit" disabled={nameSaving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />{nameSaving ? 'Guardando...' : 'Guardar nombre'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" /> Cambiar contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwMsg && (
              <div className={`rounded-lg p-3 text-sm ${pwMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {pwMsg.text}
              </div>
            )}
            <div className="grid gap-2">
              <Label>Nueva contraseña</Label>
              <Input type="password" value={pwForm.newPw} onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))} required minLength={6} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="grid gap-2">
              <Label>Confirmar nueva contraseña</Label>
              <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} required placeholder="Repite la nueva contraseña" />
            </div>
            <Button type="submit" disabled={pwSaving} variant="outline" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />{pwSaving ? 'Actualizando...' : 'Cambiar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
