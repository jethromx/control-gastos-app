'use client';
import { useState } from 'react';
import { Users, Shield, User, Trash2, UserPlus, TrendingUp, Settings } from 'lucide-react';
import { useFeatureFlags, setFeatureFlag } from '../../../presentation/hooks/use-feature-flags';
import { Card, CardContent, CardHeader, CardTitle } from '../../../presentation/components/ui/card';
import { Button } from '../../../presentation/components/ui/button';
import { Badge } from '../../../presentation/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../presentation/components/ui/dialog';
import { ConfirmDialog } from '../../../presentation/components/ui/confirm-dialog';
import { Input } from '../../../presentation/components/ui/input';
import { Label } from '../../../presentation/components/ui/label';
import { getUserRepository } from '../../../presentation/lib/di';
import { formatDate } from '../../../presentation/lib/utils';
import { inviteUser } from '../../actions/invite-user';

type ProfileRow = { id: string; full_name: string; role: string; avatar_url: string | null; created_at: string; updated_at: string };

interface Props {
  initialUsers: ProfileRow[];
  currentUserId: string;
  investmentStats: Record<string, number>;
}

const SECTION_FLAGS = [
  { key: 'section_briq',     label: 'Briq',             description: 'Inversiones con tasa fija' },
  { key: 'section_fondos',   label: 'Fondos',            description: 'Fondos de inversión' },
  { key: 'section_terrenos', label: 'Terrenos',          description: 'Compra de terrenos' },
  { key: 'section_afore',    label: 'AFORE',             description: 'Fondos para el retiro' },
  { key: 'section_otros',    label: 'Otros proyectos',   description: 'Inversiones personalizadas' },
];

export function UsersClient({ initialUsers, currentUserId, investmentStats }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [saving, setSaving] = useState<string | null>(null);
  const { flags, isEnabled } = useFeatureFlags();
  const [flagSaving, setFlagSaving] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const adminCount = users.filter((u) => u.role === 'admin').length;

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true); setInviteError('');
    const result = await inviteUser(inviteEmail);
    setInviting(false);
    if (result.error) { setInviteError(result.error); return; }
    setInviteSuccess(true);
    setTimeout(() => { setInviteOpen(false); setInviteEmail(''); setInviteSuccess(false); }, 2000);
  }

  async function toggleRole(userId: string, currentRole: string) {
    if (userId === currentUserId) return;
    setSaving(userId);
    const repo = getUserRepository();
    await repo.update(userId, { role: currentRole === 'admin' ? 'user' : 'admin' });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: currentRole === 'admin' ? 'user' : 'admin' } : u));
    setSaving(null);
  }

  async function handleToggleFlag(key: string, current: boolean) {
    setFlagSaving(key);
    await setFeatureFlag(key, !current);
    setFlagSaving(null);
  }

  async function handleDeleteConfirmed() {
    if (!confirmDeleteId || confirmDeleteId === currentUserId) return;
    setSaving(confirmDeleteId);
    const repo = getUserRepository();
    await repo.delete(confirmDeleteId);
    setUsers((prev) => prev.filter((u) => u.id !== confirmDeleteId));
    setSaving(null);
    setConfirmDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administración de usuarios</h1>
          <p className="text-gray-500">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setInviteOpen(true); setInviteError(''); setInviteSuccess(false); }}>
          <UserPlus className="h-4 w-4 mr-2" />Invitar usuario
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100">
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{users.length}</p>
              <p className="text-xs text-slate-500">Total usuarios</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Shield className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{adminCount}</p>
              <p className="text-xs text-slate-500">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
              <TrendingUp className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{(investmentStats['briq'] ?? 0) + (investmentStats['fund'] ?? 0) + (investmentStats['land'] ?? 0) + (investmentStats['custom'] ?? 0)}</p>
              <p className="text-xs text-slate-500">Inversiones</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Por tipo</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {investmentStats['briq'] > 0 && <span className="text-xs text-slate-600"><span className="font-semibold text-violet-600">{investmentStats['briq']}</span> Briq</span>}
              {investmentStats['fund'] > 0 && <span className="text-xs text-slate-600"><span className="font-semibold text-sky-600">{investmentStats['fund']}</span> Fondos</span>}
              {investmentStats['land'] > 0 && <span className="text-xs text-slate-600"><span className="font-semibold text-emerald-600">{investmentStats['land']}</span> Terrenos</span>}
              {investmentStats['custom'] > 0 && <span className="text-xs text-slate-600"><span className="font-semibold text-indigo-600">{investmentStats['custom']}</span> Otros</span>}
              {Object.keys(investmentStats).length === 0 && <span className="text-xs text-slate-400">Sin datos</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Invitar usuario</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {inviteSuccess ? (
              <p className="text-sm text-green-600 font-medium">Invitación enviada. El usuario recibirá un correo para configurar su cuenta.</p>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Correo electrónico</Label>
                  <Input type="email" placeholder="usuario@email.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                </div>
                {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
                  <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>{inviting ? 'Enviando...' : 'Enviar invitación'}</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" />Usuarios</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{u.full_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(u.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
                    {u.role === 'admin' && <Shield className="h-3 w-3" />}
                    {u.role === 'admin' ? 'Admin' : 'Usuario'}
                  </Badge>
                  {u.id !== currentUserId && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        disabled={saving === u.id}
                        onClick={() => toggleRole(u.id, u.role)}
                      >
                        {u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-500"
                        disabled={saving === u.id}
                        onClick={() => setConfirmDeleteId(u.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {u.id === currentUserId && <Badge variant="secondary">Tú</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="¿Eliminar usuario?"
        description="Esta acción no se puede deshacer. El usuario perderá acceso permanentemente."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Feature flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-slate-500" />
            Secciones disponibles
          </CardTitle>
          <p className="text-xs text-slate-400 mt-0.5">Activa o desactiva secciones para todos los usuarios</p>
        </CardHeader>
        <CardContent className="divide-y divide-slate-50">
          {SECTION_FLAGS.map((f) => {
            const enabled = isEnabled(f.key);
            const isSaving = flagSaving === f.key;
            return (
              <div key={f.key} className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{f.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>
                </div>
                <button
                  disabled={isSaving}
                  onClick={() => handleToggleFlag(f.key, enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  role="switch"
                  aria-checked={enabled}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
