import type { Role } from '@prisma/client';

export interface JwtUser {
  id: string;
  username: string;
  role: Role;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ServiceResult<T> {
  data: T;
  message?: string;
}
