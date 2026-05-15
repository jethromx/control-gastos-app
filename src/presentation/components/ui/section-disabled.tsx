import { LockKeyhole } from 'lucide-react';

interface Props {
  label?: string;
}

export function SectionDisabled({ label = 'Esta sección' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-5">
        <LockKeyhole className="h-7 w-7 text-slate-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-700">{label} no está disponible</h2>
      <p className="mt-2 text-sm text-slate-400 max-w-xs">
        Un administrador puede activarla desde el panel de configuración.
      </p>
    </div>
  );
}
