import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CapsuleStatus } from '@/types/database';
import { Lock, Unlock, Clock, FileEdit } from 'lucide-react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: CapsuleStatus | 'ready';
  variant?: 'cerulean' | 'rose' | 'muted' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  status,
  variant = 'muted',
  size = 'md',
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  if (status) {
    switch (status) {
      case 'sealed':
        return (
          <span
            className={twMerge(
              clsx(
                'inline-flex items-center font-medium rounded-full border bg-cerulean/10 text-cerulean border-cerulean/30 shadow-sm',
                sizeStyles[size],
                className
              )
            )}
            {...props}
          >
            <Lock className="w-3 h-3" />
            <span>Time-Locked</span>
          </span>
        );
      case 'ready':
        return (
          <span
            className={twMerge(
              clsx(
                'inline-flex items-center font-medium rounded-full border bg-neonRose/15 text-neonRose border-neonRose/40 shadow-glow-rose/20 animate-pulse-subtle',
                sizeStyles[size],
                className
              )
            )}
            {...props}
          >
            <Clock className="w-3 h-3" />
            <span>Ready to Open</span>
          </span>
        );
      case 'opened':
        return (
          <span
            className={twMerge(
              clsx(
                'inline-flex items-center font-medium rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                sizeStyles[size],
                className
              )
            )}
            {...props}
          >
            <Unlock className="w-3 h-3" />
            <span>Unlocked</span>
          </span>
        );
      case 'draft':
        return (
          <span
            className={twMerge(
              clsx(
                'inline-flex items-center font-medium rounded-full border bg-text-muted/10 text-text-secondary border-charcoal-border',
                sizeStyles[size],
                className
              )
            )}
            {...props}
          >
            <FileEdit className="w-3 h-3" />
            <span>Draft</span>
          </span>
        );
    }
  }

  const variants = {
    cerulean: 'bg-cerulean/10 text-cerulean border-cerulean/30',
    rose: 'bg-neonRose/10 text-neonRose border-neonRose/30',
    muted: 'bg-surface-elevated text-text-secondary border-charcoal-border',
    outline: 'border border-charcoal-borderLight text-text-primary',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium rounded-full border',
          variants[variant],
          sizeStyles[size],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
