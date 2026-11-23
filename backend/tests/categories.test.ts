import { beforeAll, describe, expect, it } from 'vitest';
import { api, makeUser, resetDb } from './helpers';

describe('categories', () => {
  let admin: Awaited<ReturnType<typeof makeUser>>;
  let citizen: Awaited<ReturnType<typeof makeUser>>;

  beforeAll(async () => {
    await resetDb();
    admin = await makeUser('ADMIN', 'admin@t.local');
    citizen = await makeUser('CITIZEN', 'cit@t.local');
  });

  it('lista es pública', async () => {
    expect((await api().get('/api/categories')).status).toBe(200);
  });

  it('solo admin crea/edita/borra (requireRole)', async () => {
    expect((await api().post('/api/categories').send({ name: 'Bache' })).status).toBe(401);
    expect((await api().post('/api/categories').set(citizen.auth).send({ name: 'Bache' })).status).toBe(403);

    const created = await api().post('/api/categories').set(admin.auth).send({ name: 'Bache' });
    expect(created.status).toBe(201);
    expect((await api().post('/api/categories').set(admin.auth).send({ name: 'bache' })).status).toBe(409);

    const id = created.body.id;
    expect((await api().put(`/api/categories/${id}`).set(admin.auth).send({ name: 'Baches' })).body.name).toBe('Baches');
    expect((await api().delete(`/api/categories/${id}`).set(admin.auth)).status).toBe(204);
    expect((await api().delete(`/api/categories/${id}`).set(admin.auth)).status).toBe(404);
  });

  it('no borra categoría con reportes y valida id', async () => {
    const cat = (await api().post('/api/categories').set(admin.auth).send({ name: 'Luz' })).body;
    await api().post('/api/reports').set(citizen.auth)
      .field('title', 'Farola rota').field('description', 'La farola no enciende').field('categoryId', cat.id);
    expect((await api().delete(`/api/categories/${cat.id}`).set(admin.auth)).status).toBe(409);
    expect((await api().delete('/api/categories/nope').set(admin.auth)).status).toBe(400);
  });
});
