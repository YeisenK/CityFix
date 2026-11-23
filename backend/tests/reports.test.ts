import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { api, makeUser, PNG, resetDb } from './helpers';

type U = Awaited<ReturnType<typeof makeUser>>;

describe('reports + comments', () => {
  let admin: U, alice: U, bob: U;
  let catId: string, otherCatId: string;
  let reportId: string;

  const create = (u: U, title: string, category = catId) =>
    api().post('/api/reports').set(u.auth)
      .field('title', title).field('description', 'Descripción suficientemente larga').field('categoryId', category);

  beforeAll(async () => {
    await resetDb();
    admin = await makeUser('ADMIN', 'admin@t.local');
    alice = await makeUser('CITIZEN', 'alice@t.local');
    bob = await makeUser('CITIZEN', 'bob@t.local');
    catId = (await api().post('/api/categories').set(admin.auth).send({ name: 'Bache' })).body.id;
    otherCatId = (await api().post('/api/categories').set(admin.auth).send({ name: 'Basura' })).body.id;
  });

  it('crear exige auth, valida y registra historial inicial', async () => {
    expect((await api().post('/api/reports').field('title', 'x')).status).toBe(401);
    expect((await create(alice, 'ab')).status).toBe(400);
    expect((await create(alice, 'Bache grande', '00000000-0000-4000-8000-000000000000')).status).toBe(400);

    const res = await create(alice, 'Bache grande').field('latitude', '19.43').field('longitude', '-99.13');
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'PENDING', latitude: 19.43, imageUrl: null, author: { id: alice.user.id } });
    reportId = res.body.id;

    const hist = await api().get(`/api/reports/${reportId}/history`);
    expect(hist.body).toHaveLength(1);
    expect(hist.body[0]).toMatchObject({ from: null, to: 'PENDING' });
  });

  it('sube imagen válida y rechaza falsas / tipos no permitidos', async () => {
    const ok = await create(alice, 'Con foto').attach('image', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(ok.status).toBe(201);
    expect(ok.body.imageUrl).toMatch(/^\/uploads\/.+\.png$/);
    expect(fs.existsSync(path.join('tests/.uploads', path.basename(ok.body.imageUrl)))).toBe(true);
    expect((await api().get(ok.body.imageUrl)).status).toBe(200);

    const fake = await create(alice, 'Falsa').attach('image', Buffer.from('no soy png'), { filename: 'a.png', contentType: 'image/png' });
    expect(fake.status).toBe(400);
    const txt = await create(alice, 'Texto').attach('image', Buffer.from('hola'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(txt.status).toBe(400);
    const big = await create(alice, 'Grande').attach('image', Buffer.alloc(6 * 1024 * 1024), { filename: 'a.png', contentType: 'image/png' });
    expect(big.status).toBe(400);

    // borrar el reporte elimina el archivo
    const file = path.join('tests/.uploads', path.basename(ok.body.imageUrl));
    expect((await api().delete(`/api/reports/${ok.body.id}`).set(alice.auth)).status).toBe(204);
    await new Promise((r) => setTimeout(r, 50));
    expect(fs.existsSync(file)).toBe(false);
  });

  it('filtros, búsqueda, orden y paginación', async () => {
    await create(bob, 'Basura acumulada', otherCatId);
    await create(bob, 'Otra basura', otherCatId);

    const all = await api().get('/api/reports?limit=2&page=1');
    expect(all.body.data).toHaveLength(2);
    expect(all.body.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });

    expect((await api().get(`/api/reports?categoryId=${otherCatId}`)).body.meta.total).toBe(2);
    expect((await api().get(`/api/reports?authorId=${alice.user.id}`)).body.meta.total).toBe(1);
    expect((await api().get('/api/reports?q=BACHE')).body.data[0].title).toBe('Bache grande');
    expect((await api().get('/api/reports?status=RESOLVED')).body.meta.total).toBe(0);
    const asc = await api().get('/api/reports?order=asc');
    expect(asc.body.data[0].title).toBe('Bache grande');
    expect((await api().get('/api/reports?limit=1000')).status).toBe(400);
  });

  it('get por id y 404', async () => {
    expect((await api().get(`/api/reports/${reportId}`)).body.id).toBe(reportId);
    expect((await api().get('/api/reports/00000000-0000-4000-8000-000000000000')).status).toBe(404);
  });

  it('solo el dueño (o admin) edita; ciudadano solo si está pendiente', async () => {
    const put = (u: U, body: object) => api().put(`/api/reports/${reportId}`).set(u.auth).send(body);
    expect((await put(bob, { title: 'Hack' })).status).toBe(403);
    expect((await put(alice, {})).status).toBe(400);
    expect((await put(alice, { title: 'Bache enorme' })).body.title).toBe('Bache enorme');
    expect((await put(admin, { title: 'Bache admin' })).status).toBe(200);
  });

  it('cambio de estado: solo admin, genera historial', async () => {
    const patch = (u: U, status: string) =>
      api().patch(`/api/reports/${reportId}/status`).set(u.auth).send({ status });
    expect((await patch(alice, 'RESOLVED')).status).toBe(403);
    expect((await patch(admin, 'PENDING')).status).toBe(400);
    expect((await patch(admin, 'BOGUS')).status).toBe(400);
    expect((await patch(admin, 'IN_PROGRESS')).body.status).toBe('IN_PROGRESS');

    const hist = (await api().get(`/api/reports/${reportId}/history`)).body;
    expect(hist.map((h: any) => h.to)).toEqual(['PENDING', 'IN_PROGRESS']);
    expect(hist[1]).toMatchObject({ from: 'PENDING', changedBy: { id: admin.user.id } });

    // ya no pendiente: el ciudadano no puede editar
    expect((await api().put(`/api/reports/${reportId}`).set(alice.auth).send({ title: 'Nuevo' })).status).toBe(403);
  });

  it('comentarios: crear, paginar, borrar con permisos', async () => {
    const post = (u: U, content: string) =>
      api().post(`/api/reports/${reportId}/comments`).set(u.auth).send({ content });
    expect((await api().post(`/api/reports/${reportId}/comments`).send({ content: 'x' })).status).toBe(401);
    expect((await post(bob, '')).status).toBe(400);
    const c1 = await post(bob, 'Yo también lo vi');
    expect(c1.status).toBe(201);
    await post(alice, 'Gracias');
    expect((await api().post('/api/reports/00000000-0000-4000-8000-000000000000/comments').set(bob.auth).send({ content: 'x' })).status).toBe(404);

    const list = await api().get(`/api/reports/${reportId}/comments?limit=1`);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.meta.total).toBe(2);
    expect((await api().get(`/api/reports/${reportId}`)).body.commentsCount).toBe(2);

    expect((await api().delete(`/api/comments/${c1.body.id}`).set(alice.auth)).status).toBe(403);
    expect((await api().delete(`/api/comments/${c1.body.id}`).set(bob.auth)).status).toBe(204);
    expect((await api().delete(`/api/comments/${c1.body.id}`).set(bob.auth)).status).toBe(404);
  });

  it('borrar reporte: ajeno 403, dueño 204, y 404 de ruta desconocida / JSON inválido', async () => {
    expect((await api().delete(`/api/reports/${reportId}`).set(bob.auth)).status).toBe(403);
    expect((await api().delete(`/api/reports/${reportId}`).set(alice.auth)).status).toBe(204);
    expect((await api().get('/api/nope')).status).toBe(404);
    const bad = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{oops');
    expect(bad.status).toBe(400);
  });
});
