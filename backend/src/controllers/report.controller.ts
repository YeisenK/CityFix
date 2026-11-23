import { asyncHandler } from '../lib/asyncHandler';
import { commentService } from '../services/comment.service';
import { reportService } from '../services/report.service';

export const reportController = {
  list: asyncHandler(async (req, res) => res.json(await reportService.list(req.query as any))),
  get: asyncHandler(async (req, res) => res.json(await reportService.get(req.params.id))),
  create: asyncHandler(async (req, res) =>
    res.status(201).json(await reportService.create(req.body, req.user!.id, req.file?.filename))),
  update: asyncHandler(async (req, res) => res.json(await reportService.update(req.params.id, req.body, req.user!))),
  changeStatus: asyncHandler(async (req, res) =>
    res.json(await reportService.changeStatus(req.params.id, req.body, req.user!))),
  remove: asyncHandler(async (req, res) => { await reportService.remove(req.params.id, req.user!); res.status(204).end(); }),
  history: asyncHandler(async (req, res) => res.json(await reportService.history(req.params.id))),

  listComments: asyncHandler(async (req, res) => {
    const { page, limit } = req.query as any;
    res.json(await commentService.list(req.params.id, page, limit));
  }),
  createComment: asyncHandler(async (req, res) =>
    res.status(201).json(await commentService.create(req.params.id, req.user!.id, req.body.content))),
  removeComment: asyncHandler(async (req, res) => {
    await commentService.remove(req.params.id, req.user!);
    res.status(204).end();
  }),
};
