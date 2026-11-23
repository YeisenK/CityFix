import { z } from 'zod';

export const createCommentSchema = z.object({ content: z.string().trim().min(1).max(1000) });
export type CreateCommentDto = z.infer<typeof createCommentSchema>;

export interface CommentDto {
  id: string;
  content: string;
  reportId: string;
  author: { id: string; name: string };
  createdAt: string;
}
