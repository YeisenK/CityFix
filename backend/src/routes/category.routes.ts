import { Router } from 'express';
import { categorySchema, idParamSchema } from '@cityfix/shared';
import { categoryController as c } from '../controllers/category.controller';
import { authenticate, requireRole } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';

export const categoryRouter = Router();
categoryRouter.get('/', c.list);
categoryRouter.post('/', authenticate, requireRole('ADMIN'), validate(categorySchema), c.create);
categoryRouter.put('/:id', authenticate, requireRole('ADMIN'), validate(idParamSchema, 'params'), validate(categorySchema), c.update);
categoryRouter.delete('/:id', authenticate, requireRole('ADMIN'), validate(idParamSchema, 'params'), c.remove);
