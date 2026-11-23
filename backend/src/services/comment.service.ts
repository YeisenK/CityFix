import type { CommentDto, Role } from '@cityfix/shared';
import { AppError } from '../lib/AppError';
import { paginate } from '../lib/pagination';
import { commentRepo } from '../repositories/comment.repo';
import { reportRepo } from '../repositories/report.repo';

type Row = Awaited<ReturnType<typeof commentRepo.create>>;
const toDto = (c: Row): CommentDto => ({
  id: c.id, content: c.content, reportId: c.reportId, author: c.author, createdAt: c.createdAt.toISOString(),
});

async function assertReport(id: string) {
  if (!(await reportRepo.findById(id))) throw AppError.notFound('Reporte no encontrado');
}

export const commentService = {
  async list(reportId: string, page: number, limit: number) {
    await assertReport(reportId);
    const { rows, total } = await commentRepo.listByReport(reportId, (page - 1) * limit, limit);
    return paginate(rows.map(toDto), total, page, limit);
  },

  async create(reportId: string, authorId: string, content: string) {
    await assertReport(reportId);
    return toDto(await commentRepo.create(reportId, authorId, content));
  },

  async remove(id: string, actor: { id: string; role: Role }) {
    const c = await commentRepo.findById(id);
    if (!c) throw AppError.notFound('Comentario no encontrado');
    if (actor.role !== 'ADMIN' && c.authorId !== actor.id) throw AppError.forbidden('No es tu comentario');
    await commentRepo.delete(id);
  },
};
