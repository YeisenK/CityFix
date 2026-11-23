import { asyncHandler } from '../lib/asyncHandler';
import { categoryService } from '../services/category.service';

export const categoryController = {
  list: asyncHandler(async (_req, res) => res.json(await categoryService.list())),
  create: asyncHandler(async (req, res) => res.status(201).json(await categoryService.create(req.body.name))),
  update: asyncHandler(async (req, res) => res.json(await categoryService.update(req.params.id, req.body.name))),
  remove: asyncHandler(async (req, res) => { await categoryService.remove(req.params.id); res.status(204).end(); }),
};
