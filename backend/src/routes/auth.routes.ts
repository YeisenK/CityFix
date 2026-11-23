import { Router } from 'express';
import { loginSchema, refreshSchema, registerSchema } from '@cityfix/shared';
import { authController as c } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { authLimiter } from '../middlewares/rateLimit';
import { validate } from '../middlewares/validate';

export const authRouter = Router();
const limiter = authLimiter();
authRouter.post('/register', limiter, validate(registerSchema), c.register);
authRouter.post('/login', limiter, validate(loginSchema), c.login);
authRouter.post('/refresh', validate(refreshSchema), c.refresh);
authRouter.post('/logout', validate(refreshSchema), c.logout);
authRouter.get('/me', authenticate, c.me);
