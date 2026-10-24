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
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cerulean font-bold mb-3">
            The Temporal Protocol
          </h2>
          <h3 className="text-3xl sm:text-4xl font-heading font-bold text-text-primary">
            Three Steps to Crossing Time
          </h3>
          <p className="text-sm sm:text-base text-text-secondary mt-3 leading-relaxed">
            A deliberate ritual of reflection, cryptographic sealing, and future rediscovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <Card className="flex flex-col justify-between" hoverEffect>
            <div>
              <div className="w-12 h-12 rounded-xl bg-cerulean/10 border border-cerulean/30 flex items-center justify-center text-cerulean mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-cerulean font-bold">STAGE 01</span>
              <h4 className="text-xl font-heading font-semibold text-text-primary mt-1 mb-2">
                Capture the Moment
              </h4>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Choose a reflection prompt, compose an unfiltered personal letter, articulate a career
                prediction, or attach memories that define where you stand today.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-charcoal-border/60 text-xs text-text-muted flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cerulean" />
              <span>Autosaves drafts automatically</span>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="flex flex-col justify-between" hoverEffect>
            <div>
              <div className="w-12 h-12 rounded-xl bg-neonRose/10 border border-neonRose/30 flex items-center justify-center text-neonRose mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-neonRose font-bold">STAGE 02</span>
              <h4 className="text-xl font-heading font-semibold text-text-primary mt-1 mb-2">
                Engage the Time-Lock
              </h4>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Select your opening milestone: 1 month, 1 year, 5 years, or an exact future moment.
                Review the preview and seal it permanently in the vault.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-charcoal-border/60 text-xs text-text-muted flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-neonRose" />
              <span>Immutable once sealed</span>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="flex flex-col justify-between" hoverEffect>
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-charcoal-borderLight flex items-center justify-center text-text-primary mb-5">
                <KeyRound className="w-6 h-6 text-cerulean" />
              </div>
              <span className="text-xs font-mono text-text-muted font-bold">STAGE 03</span>
              <h4 className="text-xl font-heading font-semibold text-text-primary mt-1 mb-2">
                Reconnect Across Time
              </h4>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                When the scheduled time arrives, the server verifies eligibility and unlocks your
                capsule. Read your original words and record post-unlock reflections.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-charcoal-border/60 text-xs text-text-muted flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Post-unlock reflection journaling</span>
            </div>
          </Card>
        </div>
      </section>

      {/* Security & Architecture Section */}
      <section id="security" className="py-24 bg-surface-deep/40 border-y border-charcoal-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-charcoal-border text-xs text-cerulean font-medium mb-4">
                <Database className="w-3.5 h-3.5 text-cerulean" />
                <span>PostgreSQL Row Level Security (RLS)</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-heading font-bold text-text-primary leading-tight">
                Cryptographic Temporal Integrity, Not Client Timers
              </h3>
              <p className="text-sm text-text-secondary mt-4 leading-relaxed">
                Most web applications that offer time capsules merely hide an unseal button with CSS.
                FutureMe Vault enforces temporal locks at both the PostgreSQL database layer and server
                API boundary.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-cerulean/10 border border-cerulean/30 flex items-center justify-center text-cerulean shrink-0 mt-0.5">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-text-primary">
                      Strict UTC Clock Synchronization
                    </h5>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Client manipulation of local device clocks cannot trigger premature access.
                      Timestamps are locked to Universal Coordinated Time (UTC).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-neonRose/10 border border-neonRose/30 flex items-center justify-center text-neonRose shrink-0 mt-0.5">
                    <EyeOff className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-text-primary">
                      Server-Side Body Redaction
                    </h5>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Until the unlock timestamp arrives, the server explicitly substitutes capsule
                      bodies with an encrypted placeholder and withholds all attachments.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Snippet */}
            <div className="rounded-xl bg-jet border border-charcoal-border p-5 font-mono text-xs text-text-secondary shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-charcoal-border/70 mb-4 text-text-muted">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-[11px]">can_view_capsule_content.sql</span>
                </span>
                <span className="text-[11px] text-cerulean">SECURITY DEFINER</span>
              </div>
              <pre className="overflow-x-auto text-[11px] leading-relaxed text-text-secondary">
{`-- Enforced at the database layer
CREATE OR REPLACE FUNCTION public.can_view_capsule_content(
    capsule_row public.capsules
) RETURNS BOOLEAN AS $$
BEGIN
    IF capsule_row.status = 'draft' THEN
        RETURN TRUE;
    END IF;
    
    IF capsule_row.status = 'opened' THEN
        RETURN TRUE;
    END IF;
    
    -- Strict UTC server timestamp comparison
    IF capsule_row.status = 'sealed' AND 
       timezone('utc', now()) >= capsule_row.scheduled_opening_at THEN
        RETURN TRUE;
    END IF;
    
    -- Access strictly blocked prior to target moment
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto scroll-mt-16">
        <div className="text-center mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cerulean font-bold mb-3">
            Inquiries & Guarantees
          </h2>
          <h3 className="text-3xl sm:text-4xl font-heading font-bold text-text-primary">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-charcoal-border bg-surface-elevated/60 backdrop-blur-sm overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-text-primary hover:text-cerulean transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cerulean"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-cerulean' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-charcoal-border/50 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-b from-surface-elevated via-surface-deep to-jet border border-charcoal-borderLight shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full bg-cerulean/10 blur-3xl pointer-events-none" />
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-text-primary mb-4">
            Begin your journey through time.
          </h3>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto mb-8">
            Create an account or launch your first digital time capsule draft today. Your future self
            will thank you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/create">
              <Button size="lg" variant="primary">
                Seal Your First Capsule
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="secondary">
                Sign In to Vault
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}