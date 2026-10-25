'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/auth/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Shield, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.resetPassword(email);
      setMessage('Check your email for the reset link');
      setSubmitted(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send reset email';
      setMessage(errorMsg);
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-cerulean/5 blur-[140px] pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cerulean rounded-xl p-1">
            <div className="w-11 h-11 rounded-xl bg-surface-elevated border border-charcoal-border flex items-center justify-center group-hover:border-cerulean/60 transition-colors shadow-sm">
              <Shield className="w-5 h-5 text-cerulean" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary tracking-tight">
            Reset Vault Access
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-1.5 leading-relaxed">
            Provide your account email to dispatch recovery instructions.
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-2xl border-charcoal-borderLight">
          {submitted ? (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-cerulean/10 border border-cerulean/30 flex items-center justify-center text-cerulean mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm text-text-primary leading-relaxed">{message}</p>
              <Link href="/auth/signin">
                <Button variant="secondary" size="sm" className="w-full mt-2" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="traveler@example.com"
              />

              <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
                Dispatch Reset Instructions
              </Button>
            </form>
          )}
        </Card>

        <p className="text-center text-xs text-text-secondary">
          <Link href="/auth/signin" className="text-cerulean font-medium hover:underline inline-flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-cerulean rounded">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
