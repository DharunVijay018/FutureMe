import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, id, disabled, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-secondary tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={twMerge(
              clsx(
                'w-full rounded-lg bg-surface-deep border border-charcoal-border px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 disabled:opacity-50 disabled:bg-surface-elevated/40 disabled:cursor-not-allowed shadow-inner',
                leftIcon && 'pl-10',
                error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20 text-red-200',
                className
              )
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-red-400 font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-muted mt-1 leading-normal">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, disabled, ...props }, ref) => {
    const textareaId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-text-secondary tracking-wide">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          className={twMerge(
            clsx(
              'w-full rounded-lg bg-surface-deep border border-charcoal-border px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 disabled:opacity-50 disabled:bg-surface-elevated/40 disabled:cursor-not-allowed shadow-inner resize-y leading-relaxed',
              error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20 text-red-200',
              className
            )
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-400 font-medium mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-muted mt-1 leading-normal">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
