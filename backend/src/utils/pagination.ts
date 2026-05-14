import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const parsePagination = (req: Request, defaults = { page: 1, limit: 20 }): PaginationParams => {
  const page = Math.max(1, parseInt(req.query.page as string) || defaults.page);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || defaults.limit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPaginationMeta = (
  total: number,
  params: PaginationParams
): PaginationMeta => {
  const totalPages = Math.ceil(total / params.limit);
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
};
