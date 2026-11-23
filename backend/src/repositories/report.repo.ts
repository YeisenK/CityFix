import type { Prisma, ReportStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const reportInclude = {
  category: { select: { id: true, name: true } },
  author: { select: { id: true, name: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.ReportInclude;

export type ReportRow = Prisma.ReportGetPayload<{ include: typeof reportInclude }>;

export const reportRepo = {
  async list(where: Prisma.ReportWhereInput, orderBy: Prisma.ReportOrderByWithRelationInput, skip: number, take: number) {
    const [rows, total] = await prisma.$transaction([
      prisma.report.findMany({ where, orderBy, skip, take, include: reportInclude }),
      prisma.report.count({ where }),
    ]);
    return { rows, total };
  },
  findById: (id: string) => prisma.report.findUnique({ where: { id }, include: reportInclude }),
  create: (data: Prisma.ReportUncheckedCreateInput) =>
    prisma.report.create({
      data: { ...data, history: { create: { changedBy: data.authorId, from: null, to: 'PENDING' } } },
      include: reportInclude,
    }),
  update: (id: string, data: Prisma.ReportUncheckedUpdateInput) =>
    prisma.report.update({ where: { id }, data, include: reportInclude }),
  changeStatus: (id: string, from: ReportStatus, to: ReportStatus, changedBy: string) =>
    prisma.report.update({
      where: { id },
      data: { status: to, history: { create: { changedBy, from, to } } },
      include: reportInclude,
    }),
  delete: (id: string) => prisma.report.delete({ where: { id } }),
  history: (reportId: string) =>
    prisma.statusHistory.findMany({
      where: { reportId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true } } },
    }),
};
