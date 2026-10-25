'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth/authService';
import { SUPPORTED_TIMEZONES } from '@/lib/time/timezone';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Shield, AlertCircle, Check } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.signUp(email, password, displayName, timezone);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected registration error occurred.';
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-neonRose/5 blur-[140px] pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cerulean rounded-xl p-1">
            <div className="w-11 h-11 rounded-xl bg-surface-elevated border border-charcoal-border flex items-center justify-center group-hover:border-cerulean/60 transition-colors shadow-sm">
              <Shield className="w-5 h-5 text-cerulean" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary tracking-tight">
            Create your Sovereign Vault
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1.5 leading-relaxed">
            Begin sealing letters and memories for future milestones.
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-2xl border-charcoal-borderLight">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-400 font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Your Name or Alias"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Mercer"
            />

            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
            />

            <Input
              label="Password (min 8 characters)"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="w-full space-y-1.5">
              <label className="block text-xs font-semibold text-text-secondary tracking-wide">
                Primary Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg bg-surface-deep border border-charcoal-border px-3.5 py-2.5 text-sm text-text-primary transition-colors focus:outline-none focus:border-cerulean"
              >
                {SUPPORTED_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} className="bg-surface-elevated text-text-primary">
                    {tz}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-text-muted">
                Used to display countdowns and opening dates accurately in your local time.
              </p>
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
              Initialize Vault
            </Button>
          </form>

          <div className="mt-5 space-y-2 text-[11px] text-text-muted border-t border-charcoal-border/70 pt-4">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cerulean" />
              <span>Server-verified UTC time-locking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cerulean" />
              <span>PostgreSQL Row Level Security protection</span>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-text-secondary">
          Already have a vault?{' '}
          <Link href="/auth/signin" className="text-cerulean font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-cerulean rounded">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
