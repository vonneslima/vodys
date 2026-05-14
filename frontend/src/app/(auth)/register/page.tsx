'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, AtSign, ArrowRight, Sparkles, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  firstName: z.string().min(1, 'Required').max(50),
  lastName:  z.string().min(1, 'Required').max(50),
  username:  z.string().min(3, 'At least 3 chars').max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Letters, numbers, _ and - only'),
  email:     z.string().email('Enter a valid email'),
  password:  z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must include uppercase')
    .regex(/[a-z]/, 'Must include lowercase')
    .regex(/[0-9]/, 'Must include a number')
    .regex(/[^A-Za-z0-9]/, 'Must include a special character'),
});

type FormValues = z.infer<typeof schema>;

const PASSWORD_RULES = [
  { re: /.{8,}/, label: '8+ characters' },
  { re: /[A-Z]/, label: 'Uppercase' },
  { re: /[0-9]/, label: 'Number' },
  { re: /[^A-Za-z0-9]/, label: 'Special char' },
];

export default function RegisterPage() {
  const { registerMutation } = useAuth();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');
  const regError = registerMutation.error as { response?: { data?: { message?: string } } } | null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-1))] p-6">
      <div className="w-full max-w-[400px] animate-scale-in">
        {/* Logo */}
        <Link href="/login" className="mb-8 flex items-center gap-2.5 group w-fit">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[hsl(var(--brand))] group-hover:brightness-110 transition-all">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight text-[hsl(var(--ink-0))]">Vodys</span>
        </Link>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[hsl(var(--ink-0))] mb-1.5">Create your account</h1>
          <p className="text-sm text-[hsl(var(--ink-2))]">
            Already a member?{' '}
            <Link href="/login" className="font-medium text-[hsl(var(--brand))] hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-[var(--radius-xl)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-0))] p-6 space-y-4"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <form onSubmit={handleSubmit((d) => registerMutation.mutate(d))} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First name" placeholder="John" leftIcon={<User className="h-4 w-4" />} error={errors.firstName?.message} {...register('firstName')} />
              <Input label="Last name" placeholder="Doe" error={errors.lastName?.message} {...register('lastName')} />
            </div>

            <Input
              label="Username"
              placeholder="johndoe"
              leftIcon={<AtSign className="h-4 w-4" />}
              error={errors.username?.message}
              {...register('username')}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="space-y-2">
              <Input
                label="Password"
                type="password"
                placeholder="Create a strong password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
              {/* Password strength pills */}
              {password.length > 0 && (
                <div className="flex gap-2 flex-wrap animate-fade-in">
                  {PASSWORD_RULES.map((r) => {
                    const ok = r.re.test(password);
                    return (
                      <span
                        key={r.label}
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all duration-200"
                        style={{
                          background: ok ? 'hsl(var(--success-subtle))' : 'hsl(var(--surface-2))',
                          color: ok ? 'hsl(var(--success))' : 'hsl(var(--ink-3))',
                        }}
                      >
                        {ok && <Check className="h-3 w-3" />}
                        {r.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {regError && (
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[hsl(var(--danger-subtle))] px-3 py-2.5 text-sm text-[hsl(var(--danger))]" role="alert">
                {regError.response?.data?.message ?? 'Something went wrong. Please try again.'}
              </div>
            )}

            <Button type="submit" className="w-full h-10 mt-1" isLoading={registerMutation.isPending}>
              {!registerMutation.isPending && <>Create account <ArrowRight className="h-4 w-4 opacity-70" /></>}
              {registerMutation.isPending && 'Creating account…'}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11px] text-[hsl(var(--ink-3))] leading-relaxed">
          By creating an account you agree to our{' '}
          <a href="#" className="underline underline-offset-2">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="underline underline-offset-2">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
