'use client';

import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Shield, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { UserAvatar } from '@/components/ui/Avatar';
import { toast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

const profileSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  weeklyGoalHours: z.coerce.number().int().min(1).max(168),
  timezone: z.string(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          weeklyGoalHours: user.weeklyGoalHours,
          timezone: user.timezone,
        }
      : undefined,
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => api.patch('/users/profile', data).then((r) => r.data.data),
    onSuccess: (updated) => {
      useAuthStore.getState().setUser({ ...user!, ...updated });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('avatar', file);
      return api.post('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
    },
    onSuccess: ({ avatarUrl }) => {
      useAuthStore.getState().setUser({ ...user!, avatarUrl });
      toast.success('Avatar updated!');
    },
    onError: () => toast.error('Failed to upload avatar'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.patch('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password changed. Please log in again.');
      passwordForm.reset();
      setTimeout(logout, 2000);
    },
    onError: () => toast.error('Failed to change password. Check your current password.'),
  });

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-0.5">Manage your account settings</p>
      </div>

      {/* Avatar */}
      <Card>
        <CardContent className="flex items-center gap-6 p-6">
          <div className="relative">
            <UserAvatar src={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} size="xl" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
              aria-label="Change avatar"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatarMutation.mutate(file);
              }}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="gap-1">
                {user.role === 'ADMIN' && <Shield className="h-3 w-3" />}
                {user.role}
              </Badge>
              <Badge variant={user.isEmailVerified ? 'success' : 'warning'}>
                {user.isEmailVerified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Member since {formatDate(user.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit((d) => updateProfileMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                error={profileForm.formState.errors.firstName?.message}
                {...profileForm.register('firstName')}
              />
              <Input
                label="Last name"
                error={profileForm.formState.errors.lastName?.message}
                {...profileForm.register('lastName')}
              />
            </div>
            <Input
              label="Username"
              error={profileForm.formState.errors.username?.message}
              {...profileForm.register('username')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Weekly goal (hours)"
                type="number"
                error={profileForm.formState.errors.weeklyGoalHours?.message}
                {...profileForm.register('weeklyGoalHours')}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Timezone</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...profileForm.register('timezone')}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="America/Sao_Paulo">Brasília (BRT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" isLoading={updateProfileMutation.isPending}>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Use a strong, unique password</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit((d) =>
              changePasswordMutation.mutate({ currentPassword: d.currentPassword, newPassword: d.newPassword })
            )}
            className="space-y-4"
          >
            <Input label="Current password" type="password" {...passwordForm.register('currentPassword')} error={passwordForm.formState.errors.currentPassword?.message} />
            <Input label="New password" type="password" {...passwordForm.register('newPassword')} error={passwordForm.formState.errors.newPassword?.message} hint="Min 8 chars, uppercase, lowercase, number, special char" />
            <Input label="Confirm password" type="password" {...passwordForm.register('confirmPassword')} error={passwordForm.formState.errors.confirmPassword?.message} />
            <div className="flex justify-end">
              <Button type="submit" variant="outline" isLoading={changePasswordMutation.isPending}>Change Password</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign out of all sessions</p>
              <p className="text-xs text-muted-foreground">This will log you out everywhere</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => api.post('/auth/logout-all').then(logout)}>
              <LogOut className="h-4 w-4" /> Sign out all
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
