import { z } from 'zod';

export const ROLES = ['CITIZEN', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72), // bcrypt ignora >72 bytes
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({ refreshToken: z.string().min(20) });
export type RefreshDto = z.infer<typeof refreshSchema>;

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}
export type TokenPair = Pick<AuthResponse, 'accessToken' | 'refreshToken'>;
