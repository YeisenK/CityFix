import type { CategoryDto } from '@cityfix/shared';
import { AppError } from '../lib/AppError';
import { categoryRepo } from '../repositories/category.repo';

const dto = (c: { id: string; name: string }): CategoryDto => ({ id: c.id, name: c.name });

export const categoryService = {
  async list() { return (await categoryRepo.list()).map(dto); },

  async create(name: string) {
    if (await categoryRepo.findByName(name)) throw AppError.conflict('La categoría ya existe');
    return dto(await categoryRepo.create(name));
  },

  async update(id: string, name: string) {
    if (!(await categoryRepo.findById(id))) throw AppError.notFound('Categoría no encontrada');
    const dup = await categoryRepo.findByName(name);
    if (dup && dup.id !== id) throw AppError.conflict('La categoría ya existe');
    return dto(await categoryRepo.update(id, name));
  },

  async remove(id: string) {
    if (!(await categoryRepo.findById(id))) throw AppError.notFound('Categoría no encontrada');
    if ((await categoryRepo.countReports(id)) > 0) throw AppError.conflict('La categoría tiene reportes asociados');
    await categoryRepo.delete(id);
  },
};
