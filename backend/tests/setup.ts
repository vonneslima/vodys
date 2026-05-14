import { prisma } from '../src/config/database';

beforeAll(async () => {
  // Ensure test database is clean
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up all test data in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.pomodoroSession.deleteMany();
  await prisma.taskTag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.event.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});
