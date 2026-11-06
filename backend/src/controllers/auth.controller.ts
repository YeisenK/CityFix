import { asyncHandler } from '../lib/asyncHandler';
import { authService } from '../services/auth.service';

export const authController = {
  register: asyncHandler(async (req, res) => res.status(201).json(await authService.register(req.body))),
  login: asyncHandler(async (req, res) => res.json(await authService.login(req.body))),
  refresh: asyncHandler(async (req, res) => res.json(await authService.refresh(req.body.refreshToken))),
  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.status(204).end();
  }),
  me: asyncHandler(async (req, res) => res.json(await authService.me(req.user!.id))),
};
