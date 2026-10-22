import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  ...props
}) => {
  const variantStyles = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-lg',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'skeleton-shimmer bg-surface-elevated/70 border border-charcoal-border/30',
          variantStyles[variant],
          className
        )
      )}
      {...props}
    />
  );
};
