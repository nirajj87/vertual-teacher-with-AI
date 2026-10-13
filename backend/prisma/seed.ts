import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { SEED_BANKS } from './seedQuestions';

const prisma = new PrismaClient();

function questionHash(text: string): string {
  return crypto.createHash('md5').update(text.toLowerCase().replace(/\s+/g, ' ').trim()).digest('hex');
}

async function ensureBank(userId: string, bank: (typeof SEED_BANKS)[number]) {
  let existing = await prisma.questionBank.findFirst({
    where: { userId, name: bank.name },
    include: { questions: { select: { text: true } } },
  });

  if (!existing) {
    existing = await prisma.questionBank.create({
      data: {
        userId,
        name: bank.name,
        description: bank.description,
        topic: bank.topic,
        isPublic: true,
      },
      include: { questions: { select: { text: true } } },
    });
    console.log(`Created bank "${bank.name}"`);
  } else if (!existing.isPublic) {
    await prisma.questionBank.update({
      where: { id: existing.id },
      data: { isPublic: true },
    });
  }

  const existingTexts = new Set(existing.questions.map((q) => q.text.trim().toLowerCase()));
  let added = 0;

  for (const q of bank.questions) {
    const key = q.text.trim().toLowerCase();
    if (existingTexts.has(key)) continue;
    await prisma.question.create({
      data: {
        bankId: existing.id,
        text: q.text,
        topic: q.topic,
        difficulty: q.difficulty || 'MEDIUM',
        hasExpectedAnswer: true,
        answer: { create: { text: q.answer } },
      },
    });
    existingTexts.add(key);
    added += 1;
  }

  const total = existingTexts.size;
  console.log(`Bank "${bank.name}": +${added} new (now ~${total} questions)`);
  return existing;
}

function modeForBank(bank: (typeof SEED_BANKS)[number]): string {
  const name = `${bank.name} ${bank.topic}`.toLowerCase();
  if (/english|tenses|voice|narration|grammar|translation|wh family|vocabulary|introduction/.test(name)) {
    return 'GRAMMAR';
  }
  if (/interview/.test(name)) return 'INTERVIEW';
  return 'PRACTICE';
}

async function seedKnowledgeCache() {
  let upserted = 0;
  for (const bank of SEED_BANKS) {
    const mode = modeForBank(bank);
    for (const q of bank.questions) {
      const contentHash = questionHash(q.text);
      await prisma.aiKnowledgeItem.upsert({
        where: { contentHash },
        create: {
          contentHash,
          questionText: q.text,
          expectedAnswer: q.answer,
          topic: q.topic,
          mode,
          difficulty: q.difficulty || 'MEDIUM',
          source: 'seed',
          useCount: 0,
        },
        update: {
          expectedAnswer: q.answer,
          topic: q.topic,
          difficulty: q.difficulty || 'MEDIUM',
          mode,
        },
      });
      upserted += 1;
    }
  }
  console.log(`AI knowledge cache upserted: ${upserted} items`);
}

async function main() {
  const adminEmail = 'admin@virtualteacher.ai';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash('Admin@123456', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        emailVerified: true,
        profile: { create: { name: 'Admin User' } },
        settings: { create: {} },
      },
    });
    console.log('Admin user created:', adminEmail);
  }

  const achievements = [
    { code: 'FIRST_SESSION', name: 'First Steps', description: 'Complete your first practice session', xpReward: 50 },
    { code: 'STREAK_7', name: 'Week Warrior', description: 'Maintain a 7-day learning streak', xpReward: 100 },
    { code: 'SCORE_9', name: 'Excellence', description: 'Score 9 or above on any question', xpReward: 75 },
    { code: 'INTERVIEW_COMPLETE', name: 'Interview Ready', description: 'Complete a mock interview', xpReward: 150 },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {},
      create: achievement,
    });
  }

  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (admin) {
    for (const bank of SEED_BANKS) {
      await ensureBank(admin.id, bank);
    }
  }

  await seedKnowledgeCache();
  console.log('Seed completed — ~20 questions per category');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
