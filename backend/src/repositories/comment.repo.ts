import { prisma } from '../lib/prisma';

const include = { author: { select: { id: true, name: true } } };

export const commentRepo = {
  async listByReport(reportId: string, skip: number, take: number) {
    const [rows, total] = await prisma.$transaction([
      prisma.comment.findMany({ where: { reportId }, orderBy: { createdAt: 'asc' }, skip, take, include }),
      prisma.comment.count({ where: { reportId } }),
    ]);
    return { rows, total };
  },
  findById: (id: string) => prisma.comment.findUnique({ where: { id } }),
  create: (reportId: string, authorId: string, content: string) =>
    prisma.comment.create({ data: { reportId, authorId, content }, include }),
  delete: (id: string) => prisma.comment.delete({ where: { id } }),
};
