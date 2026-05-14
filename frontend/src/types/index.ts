export type Role = 'USER' | 'ADMIN';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type NotificationType = 'TASK_DUE' | 'TASK_ASSIGNED' | 'POMODORO_COMPLETE' | 'SYSTEM' | 'REMINDER';
export type PomodoroType = 'work' | 'short_break' | 'long_break';
export type Theme = 'dark' | 'light' | 'system';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: Role;
  timezone: string;
  weeklyGoalHours: number;
  themePreference: Theme;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: string;
  _count?: { tasks: number; events: number; studySessions: number };
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  completedAt: string | null;
  estimatedMin: number | null;
  actualMin: number | null;
  position: number;
  subject: Pick<Subject, 'id' | 'name' | 'color' | 'icon'> | null;
  tags: Tag[];
  subtasks?: Pick<Task, 'id' | 'title' | 'status'>[];
  parent?: Pick<Task, 'id' | 'title'> | null;
  _count?: { subtasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color: string;
  location: string | null;
  subject: Pick<Subject, 'id' | 'name' | 'color'> | null;
  createdAt: string;
}

export interface PomodoroSession {
  id: string;
  durationMin: number;
  breakMin: number;
  type: PomodoroType;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  overdueCount: number;
  pomodorosThisWeek: number;
  studyMinutesThisWeek: number;
  subjectCount: number;
}

export interface WeeklyProgress {
  date: string;
  label: string;
  minutes: number;
  sessions: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

// Auth
export interface AuthTokens {
  accessToken: string;
  userId: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}
