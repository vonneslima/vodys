'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

const FEATURES = [
  { icon: '📚', text: 'Organise subjects & tasks' },
  { icon: '⏱', text: 'Pomodoro focus timer' },
  { icon: '📈', text: 'Track weekly progress' },
  { icon: '🔔', text: 'Real-time notifications' },
];

export default function LoginPage() {
  const { loginMutation } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const loginError = loginMutation.error as { response?: { data?: { message?: string } } } | null;

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[hsl(var(--surface-1))]">
      {/* ── Left panel – branding ──────────────────────────────── */}
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-[hsl(var(--surface-0))] p-12 lg:flex border-r border-[hsl(var(--border))]">
        {/* Subtle grid bg */}
        <div className="absolute inset-0 bg-grid opacity-60" />

        {/* Radial glow */}
        <div
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--brand)) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-20 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(280 80% 72%) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 animate-fade-in">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--brand))] shadow-md">
            <Sparkles className="h-4.5 w-4.5 text-white" strokeWidth={2} />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-[hsl(var(--ink-0))]">
            Vodys
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <h1 className="text-4xl font-semibold leading-[1.12] text-[hsl(var(--ink-0))] mb-5">
            Study smarter,<br />
            <span className="text-gradient">not harder.</span>
          </h1>
          <p className="text-[15px] text-[hsl(var(--ink-2))] leading-relaxed max-w-xs">
            The productivity platform built for focused students and lifelong learners.
          </p>

          {/* Feature list */}
          <ul className="mt-8 space-y-3 stagger">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 animate-fade-up">
                <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[hsl(var(--surface-2))] text-base border border-[hsl(var(--border))]">
                  {f.icon}
                </span>
                <span className="text-sm text-[hsl(var(--ink-1))]">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Social proof */}
        <div className="relative z-10 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex -space-x-2 mb-3">
            {['C', 'A', 'M', 'R'].map((l, i) => (
              <div
                key={i}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[hsl(var(--surface-1))] text-[10px] font-semibold text-white"
                style={{ background: `hsl(${258 + i * 22} 70% 62%)` }}
              >
                {l}
              </div>
            ))}
          </div>
          <p className="text-xs text-[hsl(var(--ink-3))]">
            Joined by <strong className="text-[hsl(var(--ink-2))]">2,400+</strong> students this month
          </p>
        </div>
      </div>

      {/* ── Right panel – form ─────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[360px] animate-scale-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--brand))]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold tracking-tight">Vodys</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-semibold text-[hsl(var(--ink-0))] mb-1.5">
              Welcome back
            </h2>
            <p className="text-sm text-[hsl(var(--ink-2))]">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-medium text-[hsl(var(--brand))] hover:underline underline-offset-4 transition-all">
                Sign up free
              </Link>
            </p>
          </div>

          {/* Form card */}
          <div
            className="rounded-[var(--radius-xl)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-0))] p-6"
            style={{ boxShadow: 'var(--shadow-md)' }}
          >
            <form onSubmit={handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4" noValidate>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password')}
              />

              {loginError && (
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[hsl(var(--danger-subtle))] px-3 py-2.5 text-sm text-[hsl(var(--danger))]" role="alert">
                  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4.5zm0 7a.875.875 0 110-1.75.875.875 0 010 1.75z"/>
                  </svg>
                  {loginError.response?.data?.message ?? 'Invalid credentials. Please try again.'}
                </div>
              )}

              <div className="flex items-center justify-between pt-0.5">
                <span />
                <Link href="/reset-password" className="text-xs text-[hsl(var(--ink-2))] hover:text-[hsl(var(--brand))] transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-10"
                isLoading={loginMutation.isPending}
              >
                {!loginMutation.isPending && (
                  <>Sign in <ArrowRight className="h-4 w-4 opacity-70" /></>
                )}
                {loginMutation.isPending && 'Signing in…'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[hsl(var(--border))]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[hsl(var(--surface-0))] px-3 text-xs text-[hsl(var(--ink-3))]">
                  or continue with
                </span>
              </div>
            </div>

            {/* Demo shortcut */}
            <button
              type="button"
              onClick={() => loginMutation.mutate({ email: 'demo@Vodys.dev', password: 'Demo@123!' })}
              className="w-full flex items-center justify-center gap-2.5 rounded-[var(--radius-md)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] px-4 py-2 text-sm font-medium text-[hsl(var(--ink-1))] transition-all hover:bg-[hsl(var(--surface-2))] active:scale-[0.98]"
            >
              <span>🎓</span>
              Try demo account
            </button>
          </div>

          <p className="mt-6 text-center text-[11px] text-[hsl(var(--ink-3))] leading-relaxed">
            By signing in you agree to our{' '}
            <a href="#" className="underline underline-offset-2 hover:text-[hsl(var(--ink-2))]">Terms</a>
            {' '}and{' '}
            <a href="#" className="underline underline-offset-2 hover:text-[hsl(var(--ink-2))]">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
