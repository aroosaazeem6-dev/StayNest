'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-6 w-6 ${className}`} stroke="currentColor" strokeWidth="1.8">
      <path d="m3 11 9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const status = (err as { status?: number } | null | undefined)?.status;
      const message = (err as { message?: string } | null | undefined)?.message;
      if (status === 401) {
        setError('Invalid email or password. Please try again.');
      } else if (status === 400) {
        setError(message || 'Invalid request. Please check your input.');
      } else if (status && status >= 500) {
        setError('Something went wrong on our side. Please try again later.');
      } else {
        setError(message || 'Unable to sign in. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-100 py-16">
        <div className="flex flex-col items-center gap-3 text-sage-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sage-200 border-t-forest-900" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-100 py-12">
      <div className="w-full max-w-md rounded-2xl border border-sage-200/50 bg-white p-8 shadow-[0_4px_20px_rgba(38,51,45,0.05)]">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <Logo className="text-forest-900" />
          <span className="text-2xl font-bold text-forest-900">StayNest</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-forest-900">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-sage-500">
          Sign in to manage your bookings and saved favorites.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-forest-900"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-sage-200 bg-warm-50 px-3 py-2.5 text-sm text-forest-900 placeholder-sage-400 focus:border-sage-500 focus:ring-sage-500"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-forest-900"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-sage-200 bg-warm-50 px-3 py-2.5 text-sm text-forest-900 placeholder-sage-400 focus:border-sage-500 focus:ring-sage-500"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-sage-500">
          Don&#39;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-sage-600 hover:text-forest-900"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
