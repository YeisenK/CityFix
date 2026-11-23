import crypto from 'node:crypto';
import fs from 'node:fs';
import type { RequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '../lib/AppError';
import { isRealImage, uploadsDir } from '../lib/files';

const EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => { fs.mkdirSync(uploadsDir(), { recursive: true }); cb(null, uploadsDir()); },
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${EXT[file.mimetype]}`),
});

const parser = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(AppError.badRequest('Solo se permiten imágenes JPEG, PNG o WebP')),
}).single('image');

export const uploadImage: RequestHandler[] = [
  parser,
  async (req, _res, next) => {
    try {
      if (req.file && !(await isRealImage(req.file.path, req.file.mimetype))) {
        throw AppError.badRequest('El archivo no es una imagen válida');
      }
      next();
    } catch (e) { next(e); }
  },
];
