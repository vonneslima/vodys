import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';
import type { Priority, TaskStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = 'MMM d, yyyy'): string {
  return format(new Date(date), pattern);
}

export function formatRelative(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: 'text-green-500', bg: 'bg-green-500/10' },
  MEDIUM: { label: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  HIGH: { label: 'High', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  URGENT: { label: 'Urgent', color: 'text-red-500', bg: 'bg-red-500/10' },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  TODO: { label: 'To Do', color: 'text-muted-foreground', bg: 'bg-muted' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  DONE: { label: 'Done', color: 'text-green-500', bg: 'bg-green-500/10' },
  CANCELLED: { label: 'Cancelled', color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === 'DONE' || status === 'CANCELLED') return false;
  return isPast(new Date(dueDate));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export function formatStudyTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function pomodoroToSeconds(minutes: number): number {
  return minutes * 60;
}

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
