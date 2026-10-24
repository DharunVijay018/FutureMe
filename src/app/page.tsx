'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import {
  Shield,
  Lock,
  Unlock,
  Sparkles,
  ArrowRight,
  Clock,
  KeyRound,
  FileText,
  CheckCircle2,
  ChevronDown,
  Database,
  EyeOff,
  Terminal,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'sealed' | 'unlocked'>('sealed');

  // Sample sealed capsule preview date (3 years from now)
  const sampleUnlockDate = new Date(Date.now() + 1000 * 3600 * 24 * 720).toISOString();

  const faqs = [
    {
      q: 'Can I open a sealed capsule before the designated unlock timestamp?',
      a: 'No. By architectural design, the server strictly rejects any request to decrypt or retrieve the message contents of a sealed capsule prior to the UTC timestamp chosen at sealing. Even the original author cannot bypass this server-enforced time-lock.',
    },
    {
      q: 'Can I edit or delete a capsule once it is sealed?',
      a: 'Once sealed, the content is permanently immutable. To preserve the emotional truth and commitment of your message, sealed capsules cannot be modified or altered. You can only edit capsules while they remain in draft status.',
    },
    {
      q: 'How does FutureMe Vault protect my private letters and photographs?',
      a: 'We implement PostgreSQL Row Level Security (RLS) policies at the database layer. Prior to your scheduled opening timestamp, database access rules and server API endpoints actively redact message bodies and withhold attachment URLs from all client responses.',
    },
    {
      q: 'What happens if my timezone changes before the opening date?',
      a: 'All capsule opening timestamps are stored and evaluated in Universal Coordinated Time (UTC). When you inspect or open your capsules, our interface dynamically converts the UTC timestamp into your active local timezone preference.',
    },
    {
      q: 'What formats and attachments can I preserve in my vault?',
      a: 'You can compose comprehensive letters (up to 50,000 characters) and attach high-resolution photographs (JPEG, PNG, WebP) with custom reflective captions.',
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Restrained atmospheric lighting mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] pointer-events-none overflow-hidden -z-10 select-none">
        <div className="absolute top-[-140px] left-1/3 w-[520px] h-[520px] rounded-full bg-cerulean/10 blur-[150px] opacity-70" />
        <div className="absolute top-[80px] right-1/4 w-[420px] h-[420px] rounded-full bg-neonRose/8 blur-[160px] opacity-60" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Editorial Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-elevated/90 border border-charcoal-border text-xs text-cerulean font-medium mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-neonRose" />
          <span className="font-mono text-[11px] tracking-wide text-text-primary">
            Sovereign Temporal Storage & UTC Time-Lock Architecture
          </span>
        </div>

        {/* Expressive Editorial Headline */}
        <h1 className="turbo-heading text-4xl sm:text-6xl md:text-7xl max-w-4xl mx-auto leading-[1.12] mb-6">
          A message from who you are today, to{' '}
          <span className="text-white -webkit-text-stroke-0 text-shadow-none">who you will become.</span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-10">
          Write letters, preserve memories, and document future goals. Seal them behind a
          server-enforced time-lock that cannot be breached until your designated moment arrives.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/create">
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Create Your First Capsule
            </Button>
          </Link>
          <Link href="#interactive-preview">
            <Button size="lg" variant="secondary" leftIcon={<Clock className="w-4 h-4 text-cerulean" />}>
              Explore the Experience
            </Button>
          </Link>
        </div>

        {/* Interactive Product Preview Card */}
        <div id="interactive-preview" className="mt-20 max-w-3xl mx-auto scroll-mt-24 text-left">
          <div className="relative rounded-2xl p-1 bg-gradient-to-b from-charcoal-borderLight/80 via-charcoal-border/50 to-charcoal-border/20 shadow-2xl">
            <div className="rounded-xl bg-surface-deep/95 p-6 sm:p-8 border border-charcoal-border/80 backdrop-blur-2xl">
              {/* Preview Mode Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-charcoal-border/70 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge status={previewMode === 'sealed' ? 'sealed' : 'opened'} size="sm" />
                    <span className="text-xs text-text-muted font-mono uppercase tracking-wider">
                      Capsule Preview
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-bold text-text-primary">
                    Reflections on the Horizon: Letter to 2030
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface-elevated border border-charcoal-border">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('sealed')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      previewMode === 'sealed'
                        ? 'bg-cerulean/15 text-cerulean border border-cerulean/30 shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Sealed State
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('unlocked')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      previewMode === 'unlocked'
                        ? 'bg-neonRose/15 text-neonRose border border-neonRose/30 shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Unlocked State
                  </button>
                </div>
              </div>

              {/* Countdown Ticker or Unlock Status */}
              <div className="py-6 border-b border-charcoal-border/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    {previewMode === 'sealed' ? (
                      <>
                        <Lock className="w-3.5 h-3.5 text-cerulean" /> Temporal Lock Engaging
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-emerald-400" /> Milestone Reached & Decrypted
                      </>
                    )}
                  </span>
                  <span className="text-xs text-cerulean font-mono">
                    Target: UTC 2030-01-01 00:00:00
                  </span>
                </div>

                {previewMode === 'sealed' ? (
                  <CountdownTimer scheduledOpeningAt={sampleUnlockDate} size="md" />
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Server Verified: Ready for Inspection</span>
                  </div>
                )}
              </div>

              {/* Content Preview State */}
              <div className="pt-6 space-y-4">
                {previewMode === 'sealed' ? (
                  <div className="p-4 rounded-xl bg-surface-elevated/70 border border-charcoal-border text-xs text-text-secondary space-y-2">
                    <div className="flex items-center justify-between text-text-muted font-mono text-[11px]">
                      <span className="flex items-center gap-1 text-neonRose">
                        <Shield className="w-3.5 h-3.5" /> Row Level Security Active
                      </span>
                      <span>1 Photo Attachment Sealed</span>
                    </div>
                    <p className="font-mono text-text-muted italic text-[11px] leading-relaxed">
                      [CONTENT ENCRYPTED AND STRICTLY REDACTED UNTIL TARGET TIMESTAMP. DATABASE RLS
                      POLICY REJECTS ACCESS BEFORE REQUISITE UTC TIME.]
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-surface-elevated/90 border border-charcoal-borderLight text-xs sm:text-sm text-text-primary space-y-3 leading-relaxed">
                    <p>
                      &ldquo;If you are reading this in 2030, you made it through the decade. Remember the
                      quiet evenings in 2026 when everything felt on the precipice of change? Never forget
                      your curiosity, your humility, and the promises you made to those you love.&rdquo;
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs text-cerulean font-mono">
                      <span>✓ 1 Photograph Decrypted</span>
                      <span>Verified Immutable Hash</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-text-muted pt-2">
                  <span>Category: Life & Philosophy</span>
                  <span className="text-cerulean flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" /> Immutable Temporal Artifact
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it