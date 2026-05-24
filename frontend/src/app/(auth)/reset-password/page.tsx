'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  password: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const forgotForm = useForm({ resolver: zodResolver(forgotSchema) });
  const resetForm = useForm<{ password: string }>({
  resolver: zodResolver(resetSchema),
});

  const handleForgot = async (data: { email: string }) => {
    setIsLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (data: { password: string }) => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      await authApi.resetPassword(token, data.password);
      setSuccess(true);
    } catch {
      setError('Invalid or expired reset link. Please request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <h2 className="text-xl font-semibold">
              {token ? 'Set new password' : 'Reset your password'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {token ? 'Enter your new password below' : "We'll send you a reset link"}
            </p>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="font-medium">Password reset successfully!</p>
                <Link href="/login">
                  <Button className="mt-2">Go to Login</Button>
                </Link>
              </div>
            ) : sent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <Mail className="h-12 w-12 text-primary" />
                <p className="font-medium">Check your email</p>
                <p className="text-sm text-muted-foreground">We sent a reset link to your inbox. It expires in 1 hour.</p>
              </div>
            ) : token ? (
              <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
                <Input
                  label="New password"
                  type="password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  hint="8+ chars, uppercase, lowercase, number, special char"
                  error={resetForm.formState.errors.password?.message}
                  {...resetForm.register('password')}
                />
                <Input
                  label="Confirm password"
                  type="password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={resetForm.formState.errors.confirmPassword?.message}
                  {...resetForm.register('confirmPassword')}
                />
                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
                <Button type="submit" className="w-full" isLoading={isLoading}>Reset Password</Button>
              </form>
            ) : (
              <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={forgotForm.formState.errors.email?.message as string}
                  {...forgotForm.register('email')}
                />
                {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
                <Button type="submit" className="w-full" isLoading={isLoading}>Send Reset Link</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
