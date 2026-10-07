import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../db/client';

const app = createApp();

describe('Auth & Isolation Integration Tests', () => {
  const userA = {
    fullName: 'Alice Tester',
    email: 'alice@test.com',
    password: 'Password123!',
  };

  const userB = {
    fullName: 'Bob Intruder',
    email: 'bob@test.com',
    password: 'Password123!',
  };

  let tokenA = '';
  let tokenB = '';
  let projectAId = '';

  beforeAll(async () => {
    // Clean up test data if any
    try {
      await prisma.task.deleteMany({
        where: { user: { email: { in: [userA.email, userB.email] } } },
      });
      await prisma.project.deleteMany({
        where: { user: { email: { in: [userA.email, userB.email] } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [userA.email, userB.email] } },
      });
    } catch {
      // Ignore if db is not connected yet during offline test runs
    }
  });

  afterAll(async () => {
    try {
      await prisma.task.deleteMany({
        where: { user: { email: { in: [userA.email, userB.email] } } },
      });
      await prisma.project.deleteMany({
        where: { user: { email: { in: [userA.email, userB.email] } } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [userA.email, userB.email] } },
      });
      await prisma.$disconnect();
    } catch {
      // Ignore
    }
  });

  describe('1. Authentication & Validation', () => {
    it('rejects registration with invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Bad Email',
        email: 'not-an-email',
        password: 'Password123!',
      });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects registration with short password (< 6 chars)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Short Pass',
        email: 'short@example.com',
        password: '123',
      });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('registers User A successfully', async () => {
      const res = await request(app).post('/api/auth/register').send(userA);
      expect(res.status).toBe(201);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(userA.email);
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Security: never return passwordHash
      tokenA = res.body.data.token;
    });

    it('prevents duplicate email registration', async () => {
      const res = await request(app).post('/api/auth/register').send(userA);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CONFLICT');
    });

    it('registers User B successfully', async () => {
      const res = await request(app).post('/api/auth/register').send(userB);
      expect(res.status).toBe(201);
      tokenB = res.body.data.token;
    });

    it('rejects login with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: userA.email,
        password: 'WrongPassword!',
      });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('logs in User A successfully', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: userA.email,
        password: userA.password,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('fetches current user via /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(userA.email);
    });

    it('rejects protected routes without token', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('2. Project Validation & Ownership', () => {
    it('rejects project where endDate is earlier than startDate', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Invalid Date Project',
          startDate: '2026-05-10',
          endDate: '2026-05-01', // earlier than start date
        });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('allows User A to create a valid project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Secret Project Alpha',
          description: 'Top secret project for Alice',
          status: 'IN_PROGRESS',
          startDate: '2026-05-01',
          endDate: '2026-05-15',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Secret Project Alpha');
      projectAId = res.body.data.id;
    });

    it('User B CANNOT view User A project (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectAId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('User B project list does not show User A projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(200);
      const found = res.body.data.some((p: any) => p.id === projectAId);
      expect(found).toBe(false);
    });
  });

  describe('3. Task Ownership & IDOR Vulnerability Prevention', () => {
    it('CRITICAL: User B CANNOT create a task under User A project', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          projectId: projectAId, // Belongs to User A!
          name: 'Injected Task by User B',
          priority: 'HIGH',
        });
      // MUST FAIL with 404!
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('User A can create a task under their own project', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          projectId: projectAId,
          name: 'Alice Task 1',
          priority: 'HIGH',
          status: 'PENDING',
        });
      expect(res.status).toBe(201);
      const taskId = res.body.data.id;

      // User B CANNOT update this task
      const updateRes = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          name: 'Hacked by Bob',
        });
      expect(updateRes.status).toBe(404);

      // User B CANNOT delete this task
      const deleteRes = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(deleteRes.status).toBe(404);
    });
  });
});
