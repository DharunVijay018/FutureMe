'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService, UserSession } from '@/lib/auth/authService';
import { Button } from '@/components/ui/Button';
import { Shield, Sparkles, Plus, Menu, X, LogOut, Settings, Archive, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setSession(authService.getCurrentSession());

    const handleAuthChange = () => {
      setSession(authService.getCurrentSession());
    };

    window.addEventListener('vault-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('vault-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Handle outside click or ESC key to close user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'Overview' },
    ...(session
      ? [
          { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5 mr-1" /> },
          { href: '/vault', label: 'Vault', icon: <Archive className="w-3.5 h-3.5 mr-1" /> },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-charcoal-border/80 bg-jet/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cerulean rounded-lg py-1 px-1.5"
        >
          <div className="relative w-9 h-9 rounded-xl bg-surface-elevated border border-charcoal-border flex items-center justify-center group-hover:border-cerulean/60 transition-all duration-300 shadow-sm">
            <Shield className="w-4 h-4 text-cerulean group-hover:scale-105 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-neonRose animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-heading font-bold tracking-wider text-text-primary uppercase flex items-center gap-1.5 leading-none">
              FutureMe <span className="text-cerulean font-extrabold">Vault</span>
            </span>
            <span className="text-[10px] text-text-muted tracking-widest uppercase font-mono mt-1">
              Temporal Preservation
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-deep/80 p-1 rounded-xl border border-charcoal-border/70">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-cerulean bg-surface-elevated border border-charcoal-borderLight shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/40'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions & Profile */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <Link href="/create">
                <Button size="sm" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Seal Capsule
                </Button>
              </Link>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-haspopup="true"
                  aria-expanded={userDropdownOpen}
                  aria-label="User menu"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-charcoal-border hover:border-cerulean/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cerulean"
                >
                  <div className="w-6 h-6 rounded-full bg-cerulean/20 text-cerulean text-xs font-bold flex items-center justify-center border border-cerulean/30">
                    {session.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-text-primary max-w-[120px] truncate">
                    {session.displayName}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-elevated border border-charcoal-borderLight shadow-2xl p-1.5 z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-charcoal-border/60 mb-1">
                      <p className="text-xs font-semibold text-text-primary truncate">{session.displayName}</p>
                      <p className="text-[11px] text-text-muted truncate font-mono">{session.email}</p>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-cerulean" />
                      <span>Mission Control</span>
                    </Link>

                    <Link
                      href="/vault"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5 text-cerulean" />
                      <span>Vault Archives</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-cerulean" />
                      <span>Timezone & Preferences</span>
                    </Link>

                    <div className="h-[1px] bg-charcoal-border/60 my-1" />

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link href="/auth/signin">
                <Button size="sm" variant="ghost">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" variant="primary" rightIcon={<Sparkles className="w-3.5 h-3.5" />}>
                  Create Vault
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          {session && (
            <Link href="/create">
              <Button size="sm" variant="primary" className="px-2.5 py-1 min-h-[34px]" aria-label="Create new capsule">
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg bg-surface-elevated border border-charcoal-border text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-cerulean"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-charcoal-border bg-surface-deep/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-4 animate-fade-in">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-cerulean bg-cerulean/15 font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            {session && (
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
              >
                <Settings className="w-4 h-4 text-cerulean" />
                <span>Timezone & Preferences</span>
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-charcoal-border/70">
            {session ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-cerulean/20 text-cerulean text-sm font-bold flex items-center justify-center shrink-0 border border-cerulean/30">
                    {session.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{session.displayName}</p>
                    <p className="text-[11px] text-text-muted truncate font-mono">{session.email}</p>
                  </div>
                </div>
                <Button size="sm" variant="danger" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" variant="outline">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" variant="primary">
                    Create Vault
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
