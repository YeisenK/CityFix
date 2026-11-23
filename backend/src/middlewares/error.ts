import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../lib/AppError';
import { env } from '../config/env';
import { removeUpload } from '../lib/files';

export const notFoundHandler: RequestHandler = (_req, _res, next) => next(AppError.notFound('Ruta no encontrada'));

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // si falló después de subir un archivo, no dejarlo huérfano
  if (req.file) void removeUpload(req.file.filename);
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err?.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen excede 5 MB' : err.message;
    return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'JSON inválido' } });
  }
  if (env.NODE_ENV !== 'test') console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Error interno del servidor' } });
};
