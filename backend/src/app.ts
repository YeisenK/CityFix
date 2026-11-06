import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error';
import { apiRouter } from './routes';

export const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
