import { z } from 'zod';

export const categorySchema = z.object({ name: z.string().trim().min(2).max(60) });
export type CategoryInput = z.infer<typeof categorySchema>;
export interface CategoryDto { id: string; name: string }
