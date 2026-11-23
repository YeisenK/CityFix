import { prisma } from '../lib/prisma';

export const refreshTokenRepo = {
  findByHash: (tokenHash: string) => prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } }),
  create: (data: { userId: string; familyId: string; tokenHash: string; expiresAt: Date }) =>
    prisma.refreshToken.create({ data }),
  revokeFamily: (familyId: string) =>
    prisma.refreshToken.updateMany({ where: { familyId, revokedAt: null }, data: { revokedAt: new Date() } }),
  /** Borra tokens ya expirados: no sirven ni para refrescar ni para detectar reuso. */
  async deleteExpired(now = new Date()) {
    return (await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } })).count;
  },
  /** Revoca atómicamente un token aún activo. Devuelve false si otro request ya lo rotó. */
  async revokeIfActive(id: string, replacedById?: string) {
    const r = await prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date(), replacedById },
    });
    return r.count === 1;
  },
};
