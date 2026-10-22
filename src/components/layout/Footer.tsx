import React from 'react';
import Link from 'next/link';
import { Shield, Lock, EyeOff, Server, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-charcoal-border/70 bg-surface-deep/90 text-text-secondary text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-charcoal-border flex items-center justify-center">
                <Shield className="w-4 h-4 text-cerulean" />
              </div>
              <span className="font-heading font-bold text-text-primary tracking-wide">
                FUTUREME <span className="text-cerulean">VAULT</span>
              </span>
            </div>
            <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
              A serious, sovereign digital sanctuary for letters, reflections, predictions, and
              memories sealed behind server-guaranteed temporal locks.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-charcoal-border text-[11px] text-cerulean font-mono">
                <Server className="w-3 h-3" />
                <span>PostgreSQL RLS Protected</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-charcoal-border text-[11px] text-neonRose font-mono">
                <Lock className="w-3 h-3" />
                <span>UTC Time-Lock Authority</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
              Product & Protocol
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/vault"
                  className="hover:text-cerulean transition-colors focus:outline-none focus-visible:underline inline-block py-0.5"
                >
                  Capsule Vault
                </Link>
              </li>
              <li>
                <Link
                  href="/create"
                  className="hover:text-cerulean transition-colors focus:outline-none focus-visible:underline inline-block py-0.5"
                >
                  Create New Capsule
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-cerulean transition-colors focus:outline-none focus-visible:underline inline-block py-0.5"
                >
                  Mission Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="hover:text-cerulean transition-colors focus:outline-none focus-visible:underline inline-block py-0.5"
                >
                  How Time-Locks Work
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Privacy */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
              Privacy & Safeguards
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/#security"
                  className="hover:text-cerulean transition-colors focus:outline-none focus-visible:underline inline-block py-0.5"
                >
                  Security Architecture
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="hover:text-cerulean transition-colors focus:outline-none focus-visible:underline inline-block py-0.5"
                >
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="hover:text-cerulean transition-colors focus:outline-none focus-visible:underline inline-block py-0.5"
                >
                  Data Portability & Export
                </Link>
              </li>
              <li>
                <span className="text-text-muted flex items-center gap-1.5 py-0.5">
                  <EyeOff className="w-3 h-3 text-cerulean" /> Zero Ads & Zero Tracking
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-charcoal-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} FutureMe Vault. Sovereign Temporal Storage.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] font-mono">
              <Terminal className="w-3.5 h-3.5 text-cerulean" /> System Clock: UTC Verified
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
