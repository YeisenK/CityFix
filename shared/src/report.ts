import { z } from 'zod';
import { paginationSchema } from './common';

export const REPORT_STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

// Se usa también con multipart/form-data, por eso coerce en lat/lng.
export const createReportSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  categoryId: z.string().uuid(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});
export type CreateReportDto = z.infer<typeof createReportSchema>;

export const updateReportSchema = createReportSchema
  .pick({ title: true, description: true, categoryId: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nada que actualizar');
export type UpdateReportDto = z.infer<typeof updateReportSchema>;

export const updateStatusSchema = z.object({ status: z.enum(REPORT_STATUSES) });
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;

export const listReportsSchema = paginationSchema.extend({
  status: z.enum(REPORT_STATUSES).optional(),
  categoryId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  q: z.string().trim().min(1).max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export type ListReportsQuery = z.infer<typeof listReportsSchema>;

export interface ReportDto {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ReportStatus;
  category: { id: string; name: string };
  author: { id: string; name: string };
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryDto {
  id: string;
  from: ReportStatus | null;
  to: ReportStatus;
  changedBy: { id: string; name: string };
  createdAt: string;
}
