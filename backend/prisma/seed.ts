import { PrismaClient, Role, Priority, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPasswordHash = await bcrypt.hash('Admin@123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vodys.dev' },
    update: {},
    create: {
      email: 'admin@vodys.dev',
      username: 'admin',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'Vodys',
      role: Role.ADMIN,
      isEmailVerified: true,
      weeklyGoalHours: 40,
    },
  });

  // Demo user
  const demoPasswordHash = await bcrypt.hash('Demo@123!', 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@vodys.dev' },
    update: {},
    create: {
      email: 'demo@vodys.dev',
      username: 'demouser',
      passwordHash: demoPasswordHash,
      firstName: 'Demo',
      lastName: 'User',
      role: Role.USER,
      isEmailVerified: true,
      weeklyGoalHours: 20,
    },
  });

  // Subjects for demo user
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { id: 'sub-math-001' },
      update: {},
      create: {
        id: 'sub-math-001',
        name: 'Mathematics',
        description: 'Calculus, Linear Algebra, Statistics',
        color: '#6366f1',
        icon: 'calculator',
        userId: demo.id,
      },
    }),
    prisma.subject.upsert({
      where: { id: 'sub-phys-001' },
      update: {},
      create: {
        id: 'sub-phys-001',
        name: 'Physics',
        description: 'Classical Mechanics and Quantum Physics',
        color: '#f59e0b',
        icon: 'atom',
        userId: demo.id,
      },
    }),
    prisma.subject.upsert({
      where: { id: 'sub-cs-001' },
      update: {},
      create: {
        id: 'sub-cs-001',
        name: 'Computer Science',
        description: 'Algorithms, Data Structures, System Design',
        color: '#10b981',
        icon: 'code',
        userId: demo.id,
      },
    }),
  ]);

  // Tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { id: 'tag-exam' },
      update: {},
      create: { id: 'tag-exam', name: 'exam', color: '#ef4444', userId: demo.id },
    }),
    prisma.tag.upsert({
      where: { id: 'tag-homework' },
      update: {},
      create: { id: 'tag-homework', name: 'homework', color: '#3b82f6', userId: demo.id },
    }),
    prisma.tag.upsert({
      where: { id: 'tag-review' },
      update: {},
      create: { id: 'tag-review', name: 'review', color: '#8b5cf6', userId: demo.id },
    }),
  ]);

  // Tasks
  const now = new Date();
  await Promise.all([
    prisma.task.create({
      data: {
        title: 'Complete Calculus Chapter 5',
        description: 'Integration by parts and substitution methods',
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        estimatedMin: 120,
        userId: demo.id,
        subjectId: subjects[0].id,
        tags: { create: [{ tagId: tags[0].id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: 'Physics Problem Set 3',
        description: 'Newton\'s laws application problems',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
        dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        estimatedMin: 90,
        userId: demo.id,
        subjectId: subjects[1].id,
        tags: { create: [{ tagId: tags[1].id }] },
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement Binary Search Tree',
        description: 'DSA assignment with insert, delete, search operations',
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        estimatedMin: 180,
        actualMin: 150,
        userId: demo.id,
        subjectId: subjects[2].id,
        tags: { create: [{ tagId: tags[2].id }] },
      },
    }),
  ]);

  // Pomodoro sessions
  await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.pomodoroSession.create({
        data: {
          userId: demo.id,
          durationMin: 25,
          breakMin: 5,
          completedAt: new Date(now.getTime() - i * 60 * 60 * 1000),
          type: i % 4 === 3 ? 'long_break' : i % 2 === 0 ? 'work' : 'short_break',
        },
      })
    )
  );

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: demo.id,
        type: 'TASK_DUE',
        title: 'Task Due Tomorrow',
        body: 'Complete Calculus Chapter 5 is due tomorrow',
        isRead: false,
      },
      {
        userId: demo.id,
        type: 'POMODORO_COMPLETE',
        title: 'Pomodoro Complete!',
        body: 'Great job! You completed a 25-minute focus session.',
        isRead: true,
        readAt: new Date(),
      },
      {
        userId: demo.id,
        type: 'SYSTEM',
        title: 'Welcome to Vodys!',
        body: 'Start organizing your studies and boost your productivity.',
        isRead: true,
        readAt: new Date(),
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin:', admin.email, '/ Admin@123!');
  console.log('👤 Demo:', demo.email, '/ Demo@123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
