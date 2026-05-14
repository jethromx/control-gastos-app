'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, TrendingUp, Building2, TreePine, Users,
  LogOut, Wallet, UserCircle, X, Boxes, ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { createClient } from '../../../infrastructure/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard',           label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/dashboard/briq',      label: 'Briq',       icon: TrendingUp },
  { href: '/dashboard/fondos',    label: 'Fondos',     icon: Wallet },
  { href: '/dashboard/terrenos',  label: 'Terrenos',   icon: TreePine },
  { href: '/dashboard/otros',     label: 'Otros',      icon: Boxes },
  { href: '/dashboard/perfil',    label: 'Mi perfil',  icon: UserCircle },
];

const adminItems = [
  { href: '/dashboard/usuarios', label: 'Usuarios', icon: Users },
];

interface SidebarProps {
  isAdmin?: boolean;
  userName?: string;
  onClose?: () => void;
}

export function Sidebar({ isAdmin, userName, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  const initials = userName
    ? userName.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  return (
    <aside
      className="flex h-full w-64 flex-col"
      style={{ background: 'linear-gradient(180deg, #0E0B2E 0%, #0D1023 100%)' }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white">InversionTracker</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* User avatar */}
      {userName && (
        <div className="flex items-center gap-3 px-4 py-3.5 mx-3 mt-3 rounded-xl bg-white/[0.05] border border-white/[0.06]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate leading-tight">{userName}</p>
            <p className="text-[11px] text-white/40 mt-0.5">Inversionista</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">Navegación</p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer group',
                    active
                      ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/20 text-white border border-indigo-500/20 shadow-sm'
                      : 'text-white/45 hover:bg-white/[0.07] hover:text-white/80 border border-transparent'
                  )}
                >
                  <item.icon className={cn('h-4 w-4 shrink-0 transition-colors', active ? 'text-indigo-400' : 'text-white/30 group-hover:text-white/60')} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 text-indigo-400/60" />}
                </Link>
              </li>
            );
          })}

          {isAdmin && (
            <>
              <li className="pt-5 pb-1.5">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-white/25">Admin</p>
              </li>
              {adminItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer group',
                        active
                          ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/20 text-white border border-indigo-500/20 shadow-sm'
                          : 'text-white/45 hover:bg-white/[0.07] hover:text-white/80 border border-transparent'
                      )}
                    >
                      <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-indigo-400' : 'text-white/30 group-hover:text-white/60')} />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="h-3.5 w-3.5 text-indigo-400/60" />}
                    </Link>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40 hover:bg-white/[0.07] hover:text-white/80 transition-all duration-150 cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
