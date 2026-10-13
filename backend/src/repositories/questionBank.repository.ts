import { prisma } from '../config/database';
import { DifficultyLevel, Prisma } from '@prisma/client';

export class QuestionBankRepository {
  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { OR: [{ userId }, { isPublic: true }] };
    const [banks, total] = await Promise.all([
      prisma.questionBank.findMany({
        where,
        include: { _count: { select: { questions: true } } },
        orderBy: [{ isPublic: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.questionBank.count({ where }),
    ]);
    return { banks, total, page, limit };
  }

  async findById(id: string, userId: string) {
    return prisma.questionBank.findFirst({
      where: { id, OR: [{ userId }, { isPublic: true }] },
      include: {
        questions: {
          include: { answer: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async create(userId: string, data: { name: string; description?: string; topic?: string }) {
    return prisma.questionBank.create({
      data: { userId, ...data },
    });
  }

  async update(id: string, userId: string, data: Prisma.QuestionBankUpdateInput) {
    return prisma.questionBank.updateMany({
      where: { id, userId },
      data,
    });
  }

  async delete(id: string, userId: string) {
    return prisma.questionBank.deleteMany({ where: { id, userId } });
  }

  async addQuestions(
    bankId: string,
    items: Array<{ text: string; expectedAnswer?: string; topic?: string; difficulty?: DifficultyLevel }>
  ) {
    return prisma.$transaction(
      items.map((item) =>
        prisma.question.create({
          data: {
            bankId,
            text: item.text,
            topic: item.topic,
            difficulty: item.difficulty || 'MEDIUM',
            hasExpectedAnswer: !!item.expectedAnswer,
            answer: item.expectedAnswer
              ? { create: { text: item.expectedAnswer } }
              : undefined,
          },
        })
      )
    );
  }

  async getQuestions(bankId: string, userId: string, limit?: number) {
    const bank = await prisma.questionBank.findFirst({
      where: { id: bankId, OR: [{ userId }, { isPublic: true }] },
    });
    if (!bank) return [];

    return prisma.question.findMany({
      where: { bankId },
      include: { answer: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteQuestion(questionId: string, userId: string) {
    const question = await prisma.question.findFirst({
      where: { id: questionId },
      include: { bank: true },
    });
    if (!question || question.bank.userId !== userId) return null;
    await prisma.question.delete({ where: { id: questionId } });
    return question;
  }

  async updateQuestion(
    questionId: string,
    userId: string,
    data: { text?: string; topic?: string; expectedAnswer?: string; difficulty?: DifficultyLevel }
  ) {
    const question = await prisma.question.findFirst({
      where: { id: questionId },
      include: { bank: true, answer: true },
    });
    if (!question || question.bank.userId !== userId) return null;

    await prisma.question.update({
      where: { id: questionId },
      data: {
        text: data.text,
        topic: data.topic,
        difficulty: data.difficulty,
        hasExpectedAnswer: data.expectedAnswer !== undefined ? !!data.expectedAnswer : undefined,
      },
    });

    if (data.expectedAnswer !== undefined) {
      if (question.answer) {
        await prisma.questionAnswer.update({
          where: { questionId },
          data: { text: data.expectedAnswer },
        });
      } else if (data.expectedAnswer) {
        await prisma.questionAnswer.create({
          data: { questionId, text: data.expectedAnswer },
        });
      }
    }

    return prisma.question.findUnique({
      where: { id: questionId },
      include: { answer: true },
    });
  }
}

export const questionBankRepository = new QuestionBankRepository();
