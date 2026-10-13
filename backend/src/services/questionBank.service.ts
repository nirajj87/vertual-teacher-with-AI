import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { questionBankRepository } from '../repositories/questionBank.repository';
import { parseFileBuffer, ParsedQuestionItem } from './questionParser.service';
import { cacheService } from '../cache/cache.service';
import { NotFoundError, ValidationError } from '../utils/errors';
import { CreateBankInput, CreateQuestionInput, ImportQuestionsInput } from '../validators/question.validator';
import { DifficultyLevel } from '@prisma/client';
import { prisma } from '../config/database';

export interface ImportPreview {
  previewId: string;
  fileName: string;
  totalQuestions: number;
  withAnswers: number;
  missingAnswers: number;
  items: ParsedQuestionItem[];
}

export class QuestionBankService {
  async listBanks(userId: string, page = 1, limit = 20) {
    return questionBankRepository.findByUser(userId, page, limit);
  }

  async getBank(id: string, userId: string) {
    const bank = await questionBankRepository.findById(id, userId);
    if (!bank) throw new NotFoundError('Question bank not found');
    return bank;
  }

  async createBank(userId: string, input: CreateBankInput) {
    return questionBankRepository.create(userId, input);
  }

  async updateBank(id: string, userId: string, input: Partial<CreateBankInput>) {
    const result = await questionBankRepository.update(id, userId, input);
    if (result.count === 0) throw new NotFoundError('Question bank not found');
    return this.getBank(id, userId);
  }

  async deleteBank(id: string, userId: string) {
    const result = await questionBankRepository.delete(id, userId);
    if (result.count === 0) throw new NotFoundError('Question bank not found');
  }

  async addQuestion(bankId: string, userId: string, input: CreateQuestionInput) {
    await this.getBank(bankId, userId);
    const [question] = await questionBankRepository.addQuestions(bankId, [{
      text: input.text,
      expectedAnswer: input.expectedAnswer,
      topic: input.topic,
      difficulty: input.difficulty as DifficultyLevel,
    }]);
    return question;
  }

  async updateQuestion(questionId: string, userId: string, input: Partial<CreateQuestionInput>) {
    const updated = await questionBankRepository.updateQuestion(questionId, userId, input);
    if (!updated) throw new NotFoundError('Question not found');
    return updated;
  }

  async deleteQuestion(questionId: string, userId: string) {
    const deleted = await questionBankRepository.deleteQuestion(questionId, userId);
    if (!deleted) throw new NotFoundError('Question not found');
  }

  async parseUpload(userId: string, file: Express.Multer.File): Promise<ImportPreview> {
    const buffer = fs.readFileSync(file.path);

    let items: ParsedQuestionItem[];
    try {
      items = await parseFileBuffer(buffer, file.mimetype, file.originalname);
    } catch (error) {
      fs.unlinkSync(file.path);
      throw new ValidationError(
        error instanceof Error ? error.message : 'Failed to parse file'
      );
    }

    if (items.length === 0) {
      fs.unlinkSync(file.path);
      throw new ValidationError('No questions found in file');
    }

    await prisma.fileUpload.create({
      data: {
        userId,
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
      },
    });

    const previewId = uuidv4();
    const preview: ImportPreview = {
      previewId,
      fileName: file.originalname,
      totalQuestions: items.length,
      withAnswers: items.filter((i) => i.status === 'available').length,
      missingAnswers: items.filter((i) => i.status === 'missing').length,
      items,
    };

    await cacheService.set(`import:preview:${previewId}`, { userId, ...preview }, 3600);
    return preview;
  }

  async confirmImport(userId: string, input: ImportQuestionsInput) {
    const cached = await cacheService.get<{ userId: string } & ImportPreview>(
      `import:preview:${input.previewId}`
    );
    if (!cached || cached.userId !== userId) {
      throw new ValidationError('Import preview expired or not found');
    }

    const defaultCategory = (input.topic || '').trim() || 'Miscellaneous';

    let bankId = input.bankId;
    if (!bankId) {
      const bank = await questionBankRepository.create(userId, {
        name: input.bankName || `Imported - ${cached.fileName}`,
        topic: defaultCategory,
      });
      bankId = bank.id;
    } else {
      await this.getBank(bankId, userId);
    }

    const questions = await questionBankRepository.addQuestions(
      bankId,
      input.questions.map((q) => ({
        text: q.question,
        expectedAnswer: q.expectedAnswer,
        topic: (q.topic || '').trim() || defaultCategory,
      }))
    );

    await cacheService.del(`import:preview:${input.previewId}`);

    return { bankId, imported: questions.length };
  }
}

export const questionBankService = new QuestionBankService();
