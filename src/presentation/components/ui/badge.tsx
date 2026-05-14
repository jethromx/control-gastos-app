import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ring-1',
  {
    variants: {
      variant: {
        default:     'bg-indigo-50  text-indigo-700  ring-indigo-200/60',
        secondary:   'bg-slate-100  text-slate-600   ring-slate-200/60',
        success:     'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
        warning:     'bg-amber-50   text-amber-700   ring-amber-200/60',
        destructive: 'bg-rose-50    text-rose-700    ring-rose-200/60',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
