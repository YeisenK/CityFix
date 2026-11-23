import type { Paginated } from '@cityfix/shared';

export const paginate = <T>(data: T[], total: number, page: number, limit: number): Paginated<T> => ({
  data,
  meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
});
