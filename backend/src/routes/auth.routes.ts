import { Router } from 'express';
import { loginSchema, refreshSchema, registerSchema } from '@cityfix/shared';
import { authController as c } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';

export const authRouter = Router();
authRouter.post('/register', validate(registerSchema), c.register);
authRouter.post('/login', validate(loginSchema), c.login);
authRouter.post('/refresh', validate(refreshSchema), c.refresh);
authRouter.post('/logout', validate(refreshSchema), c.logout);
authRouter.get('/me', authenticate, c.me);
