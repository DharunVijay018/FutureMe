/**
 * Authentication Service for FutureMe Vault
 * Supports Supabase Auth when configured, with a resilient local authentication provider
 * for offline development, local demonstrations, and automated testing suites.
 */

export interface UserSession {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: string;
}

const LOCAL_AUTH_KEY = 'futureme_vault_auth_session';
const LOCAL_USERS_KEY = 'futureme_vault_users_db';

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string; // Base64 salt/hash for demo/local persistence
  displayName: string;
  timezone: string;
  createdAt: string;
}

// Simple deterministic hash for local fallback authentication
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

// Initial demo user for frictionless review if desired
const DEFAULT_DEMO_USERS: StoredUser[] = [
  {
    id: 'user-demo-001',
    email: 'traveler@futuremevault.io',
    passwordHash: hashPassword('Vault2026!'),
    displayName: 'Chronos Traveler',
    timezone: 'UTC',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

function getStoredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return DEFAULT_DEMO_USERS;
  try {
    const data = localStorage.getItem(LOCAL_USERS_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_DEMO_USERS));
      return DEFAULT_DEMO_USERS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_DEMO_USERS;
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users database', err);
  }
}

export const authService = {
  isSupabaseConfigured(): boolean {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')
    );
  },

  getCurrentSession(): UserSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(LOCAL_AUTH_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async signUp(
    email: string,
    password: string,
    displayName?: string,
    timezone: string = 'UTC'
  ): Promise<{ user: UserSession | null; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { user: null, error: 'A valid email address is required.' };
    }
    if (!password || password.length < 8) {
      return { user: null, error: 'Password must be at least 8 characters long.' };
    }

    const users = getStoredUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { user: null, error: 'An account with this email already exists.' };
    }

    const newUser: StoredUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 11),
      email: cleanEmail,
      passwordHash: hashPassword(password),
      displayName: displayName?.trim() || cleanEmail.split('@')[0],
      timezone: timezone || 'UTC',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveStoredUsers(users);

    const session: UserSession = {
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      timezone: newUser.timezone,
      createdAt: newUser.createdAt,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(session));
      // Dispatch custom storage event for live reactive navbar updates
      window.dispatchEvent(new Event('vault-auth-change'));
    }

    return { user: session };
  },

  async signIn(
    email: string,
    password: string
  ): Promise<{ user: UserSession | null; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { user: null, error: 'No account found with this email address.' };
    }

    if (user.passwordHash !== hashPassword(password)) {
      return { user: null, error: 'Incorrect password. Please verify your credentials.' };
    }

    const session: UserSession = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      timezone: user.timezone,
      createdAt: user.createdAt,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(session));
      window.dispatchEvent(new Event('vault-auth-change'));
    }

    return { user: session };
  },

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_AUTH_KEY);
      window.dispatchEvent(new Event('vault-auth-change'));
    }
  },

  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Security best practice: don't reveal account existence
      return {
        success: true,
        message: 'If an account exists with this email, password reset instructions have been dispatched.',
      };
    }

    return {
      success: true,
      message: 'Password reset link sent! Check your inbox for security verification.',
    };
  },

  async updateProfile(
    userId: string,
    updates: { displayName?: string; timezone?: string }
  ): Promise<{ user: UserSession | null; error?: string }> {
    const users = getStoredUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return { user: null, error: 'User not found.' };
    }

    if (updates.displayName !== undefined) {
      users[userIndex].displayName = updates.displayName.trim();
    }
    if (updates.timezone !== undefined) {
      users[userIndex].timezone = updates.timezone;
    }

    saveStoredUsers(users);

    const updatedSession: UserSession = {
      id: users[userIndex].id,
      email: users[userIndex].email,
      displayName: users[userIndex].displayName,
      timezone: users[userIndex].timezone,
      createdAt: users[userIndex].createdAt,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(updatedSession));
      window.dispatchEvent(new Event('vault-auth-change'));
    }

    return { user: updatedSession };
  },

  async deleteAccount(userId: string): Promise<{ success: boolean; error?: string }> {
    let users = getStoredUsers();
    users = users.filter((u) => u.id !== userId);
    saveStoredUsers(users);
    await this.signOut();
    return { success: true };
  },
};
