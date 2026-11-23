import { prisma } from '../lib/prisma';

export const categoryRepo = {
  list: () => prisma.category.findMany({ orderBy: { name: 'asc' } }),
  findById: (id: string) => prisma.category.findUnique({ where: { id } }),
  findByName: (name: string) => prisma.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } }),
  create: (name: string) => prisma.category.create({ data: { name } }),
  update: (id: string, name: string) => prisma.category.update({ where: { id }, data: { name } }),
  delete: (id: string) => prisma.category.delete({ where: { id } }),
  countReports: (id: string) => prisma.report.count({ where: { categoryId: id } }),
};
