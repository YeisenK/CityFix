import { Router } from 'express';
import { authRouter } from './auth.routes';
import { categoryRouter } from './category.routes';
import { commentRouter, reportRouter } from './report.routes';

export const apiRouter = Router();
apiRouter.get('/health', (_req, res) => res.json({ status: 'ok' }));
apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/comments', commentRouter);
