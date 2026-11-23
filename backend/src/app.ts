import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { env } from './config/env';
import { apiLimiter } from './middlewares/rateLimit';
import { errorHandler, notFoundHandler } from './middlewares/error';
import { apiRouter } from './routes';

export const app = express();
if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));
app.use('/api', apiLimiter, apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
