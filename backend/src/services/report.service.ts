import type { Prisma } from '@prisma/client';
import type {
  CreateReportDto, ListReportsQuery, ReportDto, Role, StatusHistoryDto, UpdateReportDto, UpdateStatusDto,
} from '@cityfix/shared';
import { AppError } from '../lib/AppError';
import { imageUrlFor, removeUpload } from '../lib/files';
import { paginate } from '../lib/pagination';
import { categoryRepo } from '../repositories/category.repo';
import { reportRepo, type ReportRow } from '../repositories/report.repo';

type Actor = { id: string; role: Role };

export const toReportDto = (r: ReportRow): ReportDto => ({
  id: r.id, title: r.title, description: r.description, imageUrl: r.imageUrl,
  latitude: r.latitude, longitude: r.longitude, status: r.status,
  category: r.category, author: r.author, commentsCount: r._count.comments,
  createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
});

async function getOrThrow(id: string) {
  const r = await reportRepo.findById(id);
  if (!r) throw AppError.notFound('Reporte no encontrado');
  return r;
}

function assertCanModify(report: ReportRow, actor: Actor) {
  if (actor.role !== 'ADMIN' && report.author.id !== actor.id) throw AppError.forbidden('No es tu reporte');
}

export const reportService = {
  async list(q: ListReportsQuery) {
    const where: Prisma.ReportWhereInput = {
      status: q.status, categoryId: q.categoryId, authorId: q.authorId,
      ...(q.q && {
        OR: [
          { title: { contains: q.q, mode: 'insensitive' } },
          { description: { contains: q.q, mode: 'insensitive' } },
        ],
      }),
    };
    const { rows, total } = await reportRepo.list(where, { [q.sortBy]: q.order }, (q.page - 1) * q.limit, q.limit);
    return paginate(rows.map(toReportDto), total, q.page, q.limit);
  },

  async get(id: string) { return toReportDto(await getOrThrow(id)); },

  async create(dto: CreateReportDto, authorId: string, filename?: string) {
    if (!(await categoryRepo.findById(dto.categoryId))) throw AppError.badRequest('La categoría no existe');
    const created = await reportRepo.create({
      ...dto, authorId, imageUrl: filename ? imageUrlFor(filename) : null,
    });
    return toReportDto(created);
  },

  async update(id: string, dto: UpdateReportDto, actor: Actor) {
    const report = await getOrThrow(id);
    assertCanModify(report, actor);
    if (actor.role !== 'ADMIN' && report.status !== 'PENDING') {
      throw AppError.forbidden('Solo puedes editar reportes pendientes');
    }
    if (dto.categoryId && !(await categoryRepo.findById(dto.categoryId))) {
      throw AppError.badRequest('La categoría no existe');
    }
    return toReportDto(await reportRepo.update(id, dto));
  },

  async changeStatus(id: string, dto: UpdateStatusDto, actor: Actor) {
    const report = await getOrThrow(id);
    if (report.status === dto.status) throw AppError.badRequest('El reporte ya tiene ese estado');
    return toReportDto(await reportRepo.changeStatus(id, report.status, dto.status, actor.id));
  },

  async remove(id: string, actor: Actor) {
    const report = await getOrThrow(id);
    assertCanModify(report, actor);
    await reportRepo.delete(id);
    await removeUpload(report.imageUrl);
  },

  async history(id: string): Promise<StatusHistoryDto[]> {
    await getOrThrow(id);
    return (await reportRepo.history(id)).map((h) => ({
      id: h.id, from: h.from, to: h.to, changedBy: h.user, createdAt: h.createdAt.toISOString(),
    }));
  },
};
