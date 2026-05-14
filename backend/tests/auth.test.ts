import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';

const BASE = '/api/v1/auth';

const testUser = {
  email: 'test.auth@Vodys.dev',
  username: 'testauth',
  password: 'Test@1234!',
  firstName: 'Test',
  lastName: 'User',
};

describe('Auth Endpoints', () => {
  afterEach(async () => {
    await prisma.refreshToken.deleteMany({ where: { user: { email: testUser.email } } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
  });

  describe('POST /register', () => {
    it('creates a user and returns tokens', async () => {
      const res = await request(app).post(`${BASE}/register`).send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('userId');
    });

    it('rejects duplicate email', async () => {
      await request(app).post(`${BASE}/register`).send(testUser);
      const res = await request(app).post(`${BASE}/register`).send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects weak password', async () => {
      const res = await request(app)
        .post(`${BASE}/register`)
        .send({ ...testUser, password: 'weak' });

      expect(res.status).toBe(422);
    });

    it('rejects invalid email', async () => {
      const res = await request(app)
        .post(`${BASE}/register`)
        .send({ ...testUser, email: 'not-an-email' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      await request(app).post(`${BASE}/register`).send(testUser);
    });

    it('returns tokens on valid credentials', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: testUser.email, password: 'WrongPass@1!' });

      expect(res.status).toBe(401);
    });

    it('rejects non-existent user', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: 'nobody@example.com', password: testUser.password });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /me', () => {
    it('returns user data with valid token', async () => {
      const regRes = await request(app).post(`${BASE}/register`).send(testUser);
      const { accessToken } = regRes.body.data;

      const res = await request(app)
        .get(`${BASE}/me`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id');
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get(`${BASE}/me`);
      expect(res.status).toBe(401);
    });
  });
});
