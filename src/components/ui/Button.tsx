import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'rose' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-jet focus-visible:ring-cerulean disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';

    const variants = {
      primary:
        'bg-cerulean text-jet hover:bg-cerulean-hover hover:shadow-glow-cerulean font-semibold border border-cerulean/40 shadow-sm',
      rose:
        'bg-neonRose text-white hover:bg-neonRose-hover hover:shadow-glow-rose font-semibold border border-neonRose/40 shadow-sm',
      secondary:
        'bg-surface-elevated text-text-primary hover:bg-surface-hover hover:text-white border border-charcoal-border hover:border-charcoal-borderLight shadow-sm',
      outline:
        'bg-transparent text-text-primary border border-charcoal-border hover:border-cerulean/60 hover:bg-surface-elevated/60',
      ghost:
        'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-elevated/70',
      danger:
        'bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 min-h-[34px] gap-1.5',
      md: 'text-sm px-4 py-2 min-h-[40px] gap-2',
      lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
