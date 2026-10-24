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
  Plus,
  Search,
  ArrowRight,
  Archive,
  Calendar,
  Lock,
} from 'lucide-react';

export default function VaultPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'sealed' | 'ready' | 'opened'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const user = authService.getCurrentSession();
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    setSession(user);

    const fetchCapsules = async () => {
      try {
        const userCaps = await capsuleService.listUserCapsules(user.id);
        setCapsules(userCaps);
      } catch (err) {
        console.error('Failed to load vault', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCapsules();
  }, [router]);

  // DELETE FUNCTIONALITY - Now calling local service directly
  const handleDelete = async (capsuleId: string) => {
    if (!confirm("Are you sure you want to permanently delete this sealed prediction?")) return;
    
    try {
      if (!session?.id) return;
      await capsuleService.deleteCapsule(session.id, capsuleId);
      
      // Remove from UI immediately upon success
      setCapsules(prev => prev.filter(c => c.id !== capsuleId));
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to delete'}`);
    }
  };
  
  // Loading skeleton screen
  if (isLoading || !session) {
    return (
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-charcoal-border/70 pb-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-60" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <Skeleton className="h-10 w-72 rounded-xl" />
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  // Derive unique categories
  const categories = ['all', ...Array.from(new Set(capsules.map((c) => c.category)))];

  // Count metrics for tabs
  const countAll = capsules.length;
  const countSealed = capsules.filter((c) => c.status === 'sealed' && !c.is_eligible_to_open).length;
  const countReady = capsules.filter((c) => c.status === 'sealed' && c.is_eligible_to_open).length;
  const countOpened = capsules.filter((c) => c.status === 'opened').length;

  // Filter capsules
  const filteredCapsules = capsules.filter((c) => {
    if (activeTab === 'sealed' && (c.status !== 'sealed' || c.is_eligible_to_open)) return false;
    if (activeTab === 'ready' && (c.status !== 'sealed' || !c.is_eligible_to_open)) return false;
    if (activeTab === 'opened' && c.status !== 'opened') return false;

    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchCategory = c.category.toLowerCase().includes(q);
      if (!matchTitle && !matchCategory) return false;
    }

    return true;
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Vault Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-charcoal-border/70 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase text-cerulean tracking-widest font-bold">
              Temporal Preservation Vault
            </span>
            <span className="text-charcoal-border">•</span>
            <span className="text-xs text-text-muted">PostgreSQL RLS Secured</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-text-primary">
            Capsule Archives
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Browse, filter, and inspect all time capsules sealed under your credentials.
          </p>
        </div>

        <Link href="/create">
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Create New Capsule
          </Button>
        </Link>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-elevated border border-charcoal-border self-start">
          {[
            { id: 'all', label: 'All Capsules', count: countAll },
            { id: 'sealed', label: 'Sealed', count: countSealed },
            { id: 'ready', label: 'Ready to Open', count: countReady },
            { id: 'opened', label: 'Opened', count: countOpened },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'all' | 'sealed' | 'ready' | 'opened')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-surface-deep text-cerulean shadow-sm border border-charcoal-borderLight font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-cerulean/20 text-cerulean'
                    : 'bg-surface-deep text-text-muted'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or topic..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-surface-elevated border border-charcoal-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cerulean transition-colors"
            />
          </div>

          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg bg-surface-elevated border border-charcoal-border px-3 py-2 text-xs text-text-secondary focus:outline-none focus:border-cerulean transition-colors"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Capsule Grid */}
      {filteredCapsules.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-2xl bg-surface-elevated/40 border border-charcoal-border/70 space-y-4">
          <div className="w-12 h-12 rounded-full bg-cerulean/10 border border-cerulean/20 flex items-center justify-center text-cerulean mx-auto">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">No matching capsules</h3>
            <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
              No capsules correspond to the selected status or filter query.
            </p>
          </div>
          <Link href="/create">
            <Button variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create New Capsule
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCapsules.map((capsule) => {
            const isReady = capsule.status === 'sealed' && capsule.is_eligible_to_open;
            return (
              <Card
                key={capsule.id}
                hoverEffect
                className={`flex flex-col justify-between group ${
                  isReady ? 'border-neonRose/50 shadow-glow-rose/20' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge status={isReady ? 'ready' : capsule.status} size="sm" />
                    <span className="text-[11px] font-mono text-text-muted">
                      {capsule.category}
                    </span>
                  </div>

                  <Link href={`/vault/${capsule.id}`}>
                    <h3 className="text-lg font-heading font-bold text-text-primary group-hover:text-cerulean transition-colors line-clamp-2">
                      {capsule.title}
                    </h3>
                  </Link>

                  {/* Body preview / Redaction notice */}
                  {capsule.status === 'sealed' && !isReady ? (
                    <div className="p-3 rounded-lg bg-surface-deep border border-charcoal-border text-xs text-text-muted space-y-2">
                      <p className="italic font-mono text-[11px] leading-relaxed">
                        [Server-redacted. Unlock countdown active.]
                      </p>
                      <CountdownTimer
                        scheduledOpeningAt={capsule.scheduled_opening_at}
                        size="sm"
                        showLabels={false}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                      {capsule.content ===
                      '[TIME_LOCKED_CONTENT_ENCRYPTED_AND_REDACTED_UNTIL_SCHEDULED_OPENING]'
                        ? 'Temporal lock has expired! Ready for unsealing ceremony.'
                        : capsule.content}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-5 border-t border-charcoal-border/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-text-muted font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cerulean shrink-0" />
                    {formatDateWithTimezone(
                      capsule.scheduled_opening_at,
                      session.timezone,
                      false
                    )}
                  </span>

                  <div className="flex items-center gap-3">
                    {/* NEW DELETE BUTTON */}
                    <button
                      onClick={() => handleDelete(capsule.id)}
                      className="text-red-500 hover:text-red-400 font-mono text-[10px] uppercase tracking-wider transition-colors"
                    >
                      Delete
                    </button>
                    
                    <Link href={`/vault/${capsule.id}`}>
                      <Button
                        size="sm"
                        variant={isReady ? 'rose' : 'ghost'}
                        className="px-2.5 py-1 text-xs"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        {isReady ? 'Unlock' : 'Inspect'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}