'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, UserSession } from '@/lib/auth/authService';
import { capsuleService } from '@/lib/capsules/capsuleService';
import { Capsule } from '@/types/database';
import { formatDateWithTimezone } from '@/lib/time/timezone';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Lock,
  Unlock,
  Clock,
  Plus,
  ArrowRight,
  Search,
  Sparkles,
  Calendar,
  Layers,
  FileText,
  Archive,
  Compass,
  ShieldAlert,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const user = authService.getCurrentSession();
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    setSession(user);

    const loadCapsules = async () => {
      try {
        const userCaps = await capsuleService.listUserCapsules(user.id);
        setCapsules(userCaps);
      } catch (err) {
        console.error('Failed to load user capsules', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCapsules();
  }, [router]);

  // Loading skeleton screen
  if (isLoading || !session) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-charcoal-border/70 pb-8">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-64 sm:w-80" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  // Time-based personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Live metrics computed strictly from real database records
  const sealedCount = capsules.filter((c) => c.status === 'sealed' && !c.is_eligible_to_open).length;
  const readyCount = capsules.filter((c) => c.status === 'sealed' && c.is_eligible_to_open).length;
  const openedCount = capsules.filter((c) => c.status === 'opened').length;
  const totalCount = capsules.length;

  // Closest upcoming sealed capsule for the hero countdown
  const upcomingCapsules = capsules
    .filter((c) => c.status === 'sealed' && !c.is_eligible_to_open)
    .sort(
      (a, b) =>
        new Date(a.scheduled_opening_at).getTime() - new Date(b.scheduled_opening_at).getTime()
    );
  const nextCapsule = upcomingCapsules[0];

  // Ready to open items
  const readyCapsules = capsules.filter((c) => c.status === 'sealed' && c.is_eligible_to_open);

  const filteredCapsules = capsules.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
      {/* Vault Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-charcoal-border/70 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase text-cerulean tracking-wider font-semibold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Temporal Sanctuary
            </span>
            <span className="text-charcoal-border">•</span>
            <span className="text-xs text-text-muted font-mono">{session.timezone}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-text-primary tracking-tight">
            {getGreeting()},{' '}
            <span className="text-gradient-cerulean">{session.displayName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            You hold <strong className="text-text-primary">{totalCount} total</strong>{' '}
            temporal capsules in active vault custody.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/create">
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              Seal New Capsule
            </Button>
          </Link>
          <Link href="/vault">
            <Button variant="secondary" leftIcon={<Archive className="w-4 h-4" />}>
              Vault Archives
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Live Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between" hoverEffect>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-text-muted">Sealed & Locked</span>
            <Lock className="w-4 h-4 text-cerulean" />
          </div>
          <p className="text-3xl font-heading font-bold text-text-primary">{sealedCount}</p>
          <span className="text-[11px] text-text-secondary mt-1">Awaiting unlock timestamp</span>
        </Card>

        <Card className="flex flex-col justify-between border-neonRose/30 bg-neonRose/5" hoverEffect>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-neonRose font-semibold">
              Ready to Unseal
            </span>
            <Clock className="w-4 h-4 text-neonRose animate-pulse" />
          </div>
          <p className="text-3xl font-heading font-bold text-neonRose">{readyCount}</p>
          <span className="text-[11px] text-text-secondary mt-1">Time-lock criteria satisfied</span>
        </Card>

        <Card className="flex flex-col justify-between" hoverEffect>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-text-muted">Unlocked & Read</span>
            <Unlock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-heading font-bold text-text-primary">{openedCount}</p>
          <span className="text-[11px] text-text-secondary mt-1">Accessible in archives</span>
        </Card>

        <Card className="flex flex-col justify-between" hoverEffect>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-text-muted">Total Preserved</span>
            <Layers className="w-4 h-4 text-text-secondary" />
          </div>
          <p className="text-3xl font-heading font-bold text-text-primary">{totalCount}</p>
          <span className="text-[11px] text-text-secondary mt-1">All personal records</span>
        </Card>
      </div>

      {/* Attention Banner if any capsule is Ready to Open */}
      {readyCapsules.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-neonRose/20 via-surface-elevated to-surface-deep border border-neonRose/40 shadow-glow-rose/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neonRose/20 text-neonRose text-xs font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5" /> READY FOR CEREMONY
            </div>
            <h3 className="text-lg font-heading font-bold text-text-primary">
              &ldquo;{readyCapsules[0].title}&rdquo; is ready to unlock.
            </h3>
            <p className="text-xs text-text-secondary">
              The scheduled milestone has arrived. Your message and memories are ready to be revealed.
            </p>
          </div>
          <Link href={`/vault/${readyCapsules[0].id}`}>
            <Button variant="rose" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Capsule Now
            </Button>
          </Link>
        </div>
      )}

      {/* Upcoming Milestone Countdown Card */}
      {nextCapsule && (
        <Card className="p-6 sm:p-8 bg-surface-deep/90 border-charcoal-borderLight shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge status="sealed" size="sm" />
                <span className="text-xs text-text-muted font-mono uppercase tracking-wider">
                  Closest Upcoming Milestone
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-heading font-bold text-text-primary">
                {nextCapsule.title}
              </h3>
              <p className="text-xs text-text-secondary flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-cerulean shrink-0" />
                Scheduled for:{' '}
                {formatDateWithTimezone(nextCapsule.scheduled_opening_at, session.timezone, true)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <CountdownTimer scheduledOpeningAt={nextCapsule.scheduled_opening_at} size="md" />
              <Link href={`/vault/${nextCapsule.id}`}>
                <Button variant="secondary" size="sm">
                  View Detail
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Capsule Timeline Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-semibold text-text-primary">
              Capsule Timeline & Overview
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Temporal records arranged by status and scheduled horizon.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by title or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-elevated border border-charcoal-border text-xs text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:border-cerulean focus:ring-1 focus:ring-cerulean/30"
            />
          </div>
        </div>

        {/* Empty state */}
        {filteredCapsules.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-surface-elevated/40 border border-charcoal-border/70 space-y-4">
            <div className="w-12 h-12 rounded-full bg-cerulean/10 border border-cerulean/20 flex items-center justify-center text-cerulean mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">No capsules found</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? 'No capsules match your filter query. Try a different search term.'
                  : 'You have not yet sealed any capsules. Seal your first message today.'}
              </p>
            </div>
            {!searchQuery && (
              <Link href="/create">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Create First Capsule
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCapsules.map((capsule) => {
              const isEligible = capsule.status === 'sealed' && capsule.is_eligible_to_open;
              return (
                <Card
                  key={capsule.id}
                  hoverEffect
                  className="flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge
                        status={isEligible ? 'ready' : capsule.status}
                        size="sm"
                      />
                      <span className="text-[11px] font-mono text-text-muted">
                        {capsule.category}
                      </span>
                    </div>

                    <Link href={`/vault/${capsule.id}`}>
                      <h3 className="text-base font-heading font-semibold text-text-primary group-hover:text-cerulean transition-colors line-clamp-2">
                        {capsule.title}
                      </h3>
                    </Link>

                    {capsule.status === 'sealed' && !isEligible ? (
                      <p className="text-xs text-text-muted font-mono line-clamp-2 italic">
                        [Time-locked until {formatDateWithTimezone(capsule.scheduled_opening_at, session.timezone, false)}]
                      </p>
                    ) : (
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {capsule.content ===
                        '[TIME_LOCKED_CONTENT_ENCRYPTED_AND_REDACTED_UNTIL_SCHEDULED_OPENING]'
                          ? 'Ready to be opened and revealed.'
                          : capsule.content}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-charcoal-border/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-text-muted font-mono">
                      {capsule.status === 'opened' ? 'Opened' : 'Unlocks'}:{' '}
                      {formatDateWithTimezone(capsule.scheduled_opening_at, session.timezone, false)}
                    </span>

                    <Link href={`/vault/${capsule.id}`}>
                      <span className="text-cerulean hover:underline font-medium text-xs flex items-center gap-1">
                        View <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
