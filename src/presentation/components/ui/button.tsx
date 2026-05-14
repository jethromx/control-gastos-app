'use client';
import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.15),_inset_0_1px_0_rgba(255,255,255,0.15)] hover:from-indigo-600 hover:to-indigo-700 active:from-indigo-700 active:to-indigo-800',
        destructive:
          'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[0_1px_2px_rgba(0,0,0,0.15),_inset_0_1px_0_rgba(255,255,255,0.15)] hover:from-rose-600 hover:to-rose-700',
        outline:
          'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100',
        secondary:
          'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300',
        ghost:
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
        link:
          'text-indigo-600 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs rounded-lg',
        lg: 'h-11 px-6 text-base rounded-xl',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
