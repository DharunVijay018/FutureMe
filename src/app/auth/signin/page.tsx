'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await authService.signIn(email, password);
      if (res.error) {
        setError(res.error);
        setIsLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('An unexpected authentication error occurred.');
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setIsLoading(true);
    const res = await authService.signIn('traveler@futuremevault.io', 'Vault2026!');
    if (res.error) {
      await authService.signUp('traveler@futuremevault.io', 'Vault2026!', 'Chronos Traveler', 'UTC');
    }
    router.push('/dashboard');
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-cerulean/5 blur-[130px] pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cerulean rounded-xl p-1">
            <div className="w-11 h-11 rounded-xl bg-surface-elevated border border-charcoal-border flex items-center justify-center group-hover:border-cerulean/60 transition-colors shadow-sm">
              <Shield className="w-5 h-5 text-cerulean" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary tracking-tight">
            Unlock your Vault
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1.5 leading-relaxed">
            Access your sealed capsules, scheduled messages, and personal memories.
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
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="traveler@example.com"
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-text-secondary">Password</label>
                <Link
                  href="/auth/reset"
                  className="text-xs text-cerulean hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-cerulean rounded"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
              Sign In to Vault
            </Button>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="mt-6 pt-6 border-t border-charcoal-border/70 text-center">
            <p className="text-xs text-text-muted mb-3 font-mono">
              Evaluating this portfolio project?
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDemoSignIn}
              className="w-full text-xs"
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-neonRose" />}
            >
              Sign In with 1-Click Demo Traveler
            </Button>
          </div>
        </Card>

        <p className="text-center text-xs text-text-secondary">
          Don&apos;t have a vault yet?{' '}
          <Link href="/auth/signup" className="text-cerulean font-medium hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-cerulean rounded">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
