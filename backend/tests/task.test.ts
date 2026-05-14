import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';

const AUTH_BASE = '/api/v1/auth';
const TASK_BASE = '/api/v1/tasks';

const testUser = {
  email: 'test.tasks@Vodys.dev',
  username: 'testtasks',
  password: 'Test@1234!',
  firstName: 'Task',
  lastName: 'Tester',
};

let accessToken: string;
let userId: string;

describe('Task Endpoints', () => {
  beforeAll(async () => {
    const res = await request(app).post(`${AUTH_BASE}/register`).send(testUser);
    accessToken = res.body.data.accessToken;
    userId = res.body.data.userId;
  });

  afterAll(async () => {
    await prisma.taskTag.deleteMany({ where: { task: { userId } } });
    await prisma.task.deleteMany({ where: { userId } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  const authHeader = () => ({ Authorization: `Bearer ${accessToken}` });

  describe('POST /tasks', () => {
    it('creates a task', async () => {
      const res = await request(app)
        .post(TASK_BASE)
        .set(authHeader())
        .send({ title: 'Study Calculus', priority: 'HIGH' });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Study Calculus');
      expect(res.body.data.priority).toBe('HIGH');
    });

    it('rejects task without title', async () => {
      const res = await request(app)
        .post(TASK_BASE)
        .set(authHeader())
        .send({ priority: 'HIGH' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /tasks', () => {
    it('returns paginated task list', async () => {
      const res = await request(app).get(TASK_BASE).set(authHeader());

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toHaveProperty('total');
    });

    it('filters by status', async () => {
      const res = await request(app)
        .get(`${TASK_BASE}?status=TODO`)
        .set(authHeader());

      expect(res.status).toBe(200);
      res.body.data.forEach((task: { status: string }) => {
        expect(task.status).toBe('TODO');
      });
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('updates a task status', async () => {
      const create = await request(app)
        .post(TASK_BASE)
        .set(authHeader())
        .send({ title: 'Update Me' });

      const taskId = create.body.data.id;

      const res = await request(app)
        .patch(`${TASK_BASE}/${taskId}`)
        .set(authHeader())
        .send({ status: 'DONE' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DONE');
      expect(res.body.data.completedAt).toBeTruthy();
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('deletes a task', async () => {
      const create = await request(app)
        .post(TASK_BASE)
        .set(authHeader())
        .send({ title: 'Delete Me' });

      const taskId = create.body.data.id;

      const res = await request(app)
        .delete(`${TASK_BASE}/${taskId}`)
        .set(authHeader());

      expect(res.status).toBe(204);
    });

    it('cannot delete another user task', async () => {
      // Register a second user
      const other = await request(app).post(`${AUTH_BASE}/register`).send({
        email: 'other@Vodys.dev',
        username: 'otheruser2',
        password: 'Other@1234!',
        firstName: 'Other',
        lastName: 'User',
      });
      const otherToken = other.body.data.accessToken;

      const create = await request(app)
        .post(TASK_BASE)
        .set(authHeader())
        .send({ title: 'My Private Task' });

      const taskId = create.body.data.id;

      const res = await request(app)
        .delete(`${TASK_BASE}/${taskId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);

      // Cleanup
      await prisma.user.delete({ where: { email: 'other@Vodys.dev' } });
    });
  });
});
