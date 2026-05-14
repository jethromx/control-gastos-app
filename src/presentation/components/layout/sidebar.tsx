'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, Building2, TreePine, Users, LogOut, Wallet, UserCircle, X, Boxes } from 'lucide-react';
import { cn } from '../../lib/utils';
import { createClient } from '../../../infrastructure/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/briq', label: 'Briq', icon: TrendingUp },
  { href: '/dashboard/fondos', label: 'Fondos', icon: Wallet },
  { href: '/dashboard/terrenos', label: 'Terrenos', icon: TreePine },
  { href: '/dashboard/otros', label: 'Otros', icon: Boxes },
  { href: '/dashboard/perfil', label: 'Mi perfil', icon: UserCircle },
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

  function handleNavClick() {
    onClose?.();
  }

  const initials = userName
    ? userName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-slate-100">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight text-white">InversionTracker</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User section */}
      {userName && (
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-slate-400">Inversionista</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer',
                    active
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-transparent'
                  )}
                >
                  <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-indigo-400' : 'text-slate-500')} />
                  {item.label}
                </Link>
              </li>
            );
          })}

          {isAdmin && (
            <>
              <li className="pt-5 pb-1">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Admin</p>
              </li>
              {adminItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer',
                        active
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-transparent'
                      )}
                    >
                      <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-indigo-400' : 'text-slate-500')} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </>
          )}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all duration-150 cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
