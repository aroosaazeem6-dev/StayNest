'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>;

function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`h-6 w-6 ${className}`} stroke="currentColor" strokeWidth="1.8">
      <path d="m3 11 9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
    if (!name.trim()) errors.name = 'Name is required';
    else if (name.trim().length < 1) errors.name = 'Name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8)
      errors.password = 'Password must be at least 8 characters';
    if (password !== confirm) {
      errors.confirm = 'Passwords do not match';
    }
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
      await register(email.trim(), password, name.trim());
    } catch (err) {
      const status = (err as { status?: number } | null | undefined)?.status;
      const message = (err as { message?: string | string[] } | null | undefined)?.message;
      if (status === 409) {
        setError('This email is already registered. Please login instead.');
      } else if (status === 400) {
        setError(
          typeof message === 'string'
            ? message
            : Array.isArray(message)
              ? message.join(', ')
              : 'Invalid request. Please check your input.',
        );
      } else if (status && status >= 500) {
        setError('Something went wrong on our side. Please try again later.');
      } else {
        setError(typeof message === 'string' ? message : 'Unable to create your account. Please try again.');
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
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-sage-500">
          Join StayNest to start booking stays. Public registration creates a
          guest account.
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
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-forest-900"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-sage-200 bg-warm-50 px-3 py-2.5 text-sm text-forest-900 placeholder-sage-400 focus:border-sage-500 focus:ring-sage-500"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
            )}
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-sage-200 bg-warm-50 px-3 py-2.5 text-sm text-forest-900 placeholder-sage-400 focus:border-sage-500 focus:ring-sage-500"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="mb-1.5 block text-sm font-medium text-forest-900"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-sage-200 bg-warm-50 px-3 py-2.5 text-sm text-forest-900 placeholder-sage-400 focus:border-sage-500 focus:ring-sage-500"
            />
            {fieldErrors.confirm && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.confirm}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-sage-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-sage-600 hover:text-forest-900"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
