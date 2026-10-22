'use client';

import React, { useEffect, useState } from 'react';
import { calculateCountdown, CountdownResult } from '@/lib/time/timezone';
import { Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CountdownTimerProps {
  scheduledOpeningAt: string;
  onExpire?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabels?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  scheduledOpeningAt,
  onExpire,
  size = 'md',
  className,
  showLabels = true,
}) => {
  const [countdown, setCountdown] = useState<CountdownResult>(() =>
    calculateCountdown(scheduledOpeningAt)
  );

  useEffect(() => {
    const initial = calculateCountdown(scheduledOpeningAt);
    setCountdown(initial);
    if (initial.isExpired && onExpire) {
      onExpire();
    }

    const interval = setInterval(() => {
      const next = calculateCountdown(scheduledOpeningAt);
      setCountdown(next);
      if (next.isExpired) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scheduledOpeningAt, onExpire]);

  if (countdown.isExpired) {
    return (
      <div
        className={twMerge(
          clsx(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neonRose/15 border border-neonRose/40 text-neonRose font-semibold shadow-glow-rose/20 animate-pulse-subtle',
            className
          )
        )}
      >
        <Sparkles className="w-3.5 h-3.5 animate-spin shrink-0 text-neonRose" />
        <span className="text-xs uppercase tracking-wider font-mono">
          Time-Lock Expired — Ready to Unseal
        </span>
      </div>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  const unitSizes = {
    sm: {
      box: 'px-2 py-1 min-w-[34px]',
      num: 'text-xs sm:text-sm font-bold font-mono',
      lbl: 'text-[8px] sm:text-[9px]',
    },
    md: {
      box: 'px-2.5 sm:px-3 py-1.5 sm:py-2 min-w-[46px] sm:min-w-[52px]',
      num: 'text-base sm:text-xl font-bold font-mono',
      lbl: 'text-[9px] sm:text-[10px]',
    },
    lg: {
      box: 'px-3 sm:px-4 py-2 sm:py-3 min-w-[56px] sm:min-w-[70px]',
      num: 'text-xl sm:text-3xl font-bold font-mono',
      lbl: 'text-[10px] sm:text-xs',
    },
  };

  const currentSize = unitSizes[size];

  const units = [
    { label: 'DAYS', value: countdown.days },
    { label: 'HRS', value: pad(countdown.hours) },
    { label: 'MIN', value: pad(countdown.minutes) },
    { label: 'SEC', value: pad(countdown.seconds) },
  ];

  return (
    <div
      role="timer"
      aria-label={`Time remaining: ${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds`}
      className={twMerge('flex items-center gap-1.5 sm:gap-2 select-none flex-wrap sm:flex-nowrap', className)}
    >
      {units.map((unit, idx) => (
        <React.Fragment key={unit.label}>
          <div
            className={clsx(
              'flex flex-col items-center justify-center rounded-lg bg-surface-deep border border-charcoal-borderLight/60 text-center shadow-inner relative overflow-hidden',
              currentSize.box
            )}
          >
            <div className="absolute top-0 inset-x-0 h-[1px] bg-white/10 pointer-events-none" />
            <span className={clsx('text-cerulean tracking-tight', currentSize.num)}>
              {unit.value}
            </span>
            {showLabels && (
              <span className={clsx('text-text-muted font-medium tracking-wider uppercase font-mono mt-0.5', currentSize.lbl)}>
                {unit.label}
              </span>
            )}
          </div>
          {idx < units.length - 1 && (
            <span className="text-cerulean/50 font-mono text-xs sm:text-sm font-bold -mt-2">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
