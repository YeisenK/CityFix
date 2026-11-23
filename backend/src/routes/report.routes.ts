import { Router } from 'express';
import {
  createCommentSchema, createReportSchema, idParamSchema, listReportsSchema, paginationSchema,
  updateReportSchema, updateStatusSchema,
} from '@cityfix/shared';
import { reportController as c } from '../controllers/report.controller';
import { authenticate, requireRole } from '../middlewares/authenticate';
import { uploadImage } from '../middlewares/upload';
import { validate } from '../middlewares/validate';

export const reportRouter = Router();
const id = validate(idParamSchema, 'params');

reportRouter.get('/', validate(listReportsSchema, 'query'), c.list);
reportRouter.post('/', authenticate, ...uploadImage, validate(createReportSchema), c.create);
reportRouter.get('/:id', id, c.get);
reportRouter.put('/:id', authenticate, id, validate(updateReportSchema), c.update);
reportRouter.patch('/:id/status', authenticate, requireRole('ADMIN'), id, validate(updateStatusSchema), c.changeStatus);
reportRouter.delete('/:id', authenticate, id, c.remove);
reportRouter.get('/:id/history', id, c.history);
reportRouter.get('/:id/comments', id, validate(paginationSchema, 'query'), c.listComments);
reportRouter.post('/:id/comments', authenticate, id, validate(createCommentSchema), c.createComment);

export const commentRouter = Router();
commentRouter.delete('/:id', authenticate, id, c.removeComment);
