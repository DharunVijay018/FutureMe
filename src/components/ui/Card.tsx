import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glow?: 'none' | 'cerulean' | 'rose';
  hasHighlight?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  hoverEffect = false,
  glow = 'none',
  hasHighlight = false,
  children,
  ...props
}) => {
  const glowStyles = {
    none: '',
    cerulean: 'hover:border-cerulean/40 hover:shadow-glow-cerulean/15',
    rose: 'hover:border-neonRose/40 hover:shadow-glow-rose/15',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'bg-surface-elevated/85 backdrop-blur-md border border-charcoal-border rounded-xl p-5 sm:p-6 transition-all duration-300 relative overflow-hidden shadow-vault-card',
          hoverEffect && 'hover:bg-surface-elevated hover:border-charcoal-borderLight hover:-translate-y-0.5',
          glowStyles[glow],
          className
        )
      )}
      {...props}
    >
      {/* Subtle top edge specular highlight line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      {hasHighlight && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-cerulean/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
      )}
      {children}
    </div>
  );
};
