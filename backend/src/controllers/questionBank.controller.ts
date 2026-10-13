import { Request, Response, NextFunction } from 'express';
import { questionBankService } from '../services/questionBank.service';
import { sendSuccess } from '../utils/apiResponse';
import { paramId } from '../utils/params';

export class QuestionBankController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await questionBankService.listBanks(req.user!.userId, page, limit);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bank = await questionBankService.getBank(paramId(req.params.id), req.user!.userId);
      sendSuccess(res, bank);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bank = await questionBankService.createBank(req.user!.userId, req.body);
      sendSuccess(res, bank, 201);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bank = await questionBankService.updateBank(paramId(req.params.id), req.user!.userId, req.body);
      sendSuccess(res, bank);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await questionBankService.deleteBank(paramId(req.params.id), req.user!.userId);
      sendSuccess(res, { message: 'Question bank deleted' });
    } catch (error) {
      next(error);
    }
  };

  addQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const question = await questionBankService.addQuestion(
        paramId(req.params.bankId),
        req.user!.userId,
        req.body
      );
      sendSuccess(res, question, 201);
    } catch (error) {
      next(error);
    }
  };

  updateQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const question = await questionBankService.updateQuestion(
        paramId(req.params.questionId),
        req.user!.userId,
        req.body
      );
      sendSuccess(res, question);
    } catch (error) {
      next(error);
    }
  };

  deleteQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await questionBankService.deleteQuestion(paramId(req.params.questionId), req.user!.userId);
      sendSuccess(res, { message: 'Question deleted' });
    } catch (error) {
      next(error);
    }
  };

  uploadPreview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded', code: 'VALIDATION_ERROR' });
        return;
      }
      const preview = await questionBankService.parseUpload(req.user!.userId, req.file);
      sendSuccess(res, preview);
    } catch (error) {
      next(error);
    }
  };

  confirmImport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await questionBankService.confirmImport(req.user!.userId, req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  };

  downloadTemplate = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const XLSX = await import('xlsx');
      const rows = [
        {
          Question: 'What is polymorphism in Object-Oriented Programming?',
          'Expected Answer':
            'Polymorphism lets objects of different types be used through a common interface.',
          Category: 'OOPS',
          Difficulty: 'MEDIUM',
        },
        {
          Question: 'Explain the difference between INNER JOIN and LEFT JOIN in MySQL.',
          'Expected Answer':
            'INNER JOIN returns matching rows only; LEFT JOIN returns all left rows plus matches.',
          Category: 'MySQL',
          Difficulty: 'MEDIUM',
        },
        {
          Question: 'What is the Virtual DOM in React?',
          'Expected Answer':
            'A lightweight JS copy of the UI that React diffs to update the real DOM efficiently.',
          Category: 'React',
          Difficulty: 'BEGINNER',
        },
        {
          Question: 'What are Laravel migrations?',
          'Expected Answer':
            'Version-controlled database schema changes managed with Artisan migrate commands.',
          Category: 'Laravel',
          Difficulty: 'MEDIUM',
        },
        {
          Question: 'Correct: I am working here since two years.',
          'Expected Answer': 'I have been working here for two years.',
          Category: 'English',
          Difficulty: 'BEGINNER',
        },
        {
          Question: 'Tell me about yourself.',
          'Expected Answer':
            'Brief intro: background, key skills, relevant experience, and career goal.',
          Category: 'Interview',
          Difficulty: 'BEGINNER',
        },
        {
          Question: 'Add your own question here',
          'Expected Answer': 'Add the model / expected answer (optional but recommended)',
          Category: 'Miscellaneous',
          Difficulty: 'MEDIUM',
        },
      ];

      const sheet = XLSX.utils.json_to_sheet(rows);
      sheet['!cols'] = [
        { wch: 70 },
        { wch: 70 },
        { wch: 18 },
        { wch: 12 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, 'Questions');

      // Instructions sheet
      const help = XLSX.utils.aoa_to_sheet([
        ['Question Upload Template — Instructions'],
        [''],
        ['1. Keep the header row exactly: Question | Expected Answer | Category | Difficulty'],
        ['2. Fill one question per row'],
        ['3. Category examples: Laravel, React, MySQL, OOPS, English, Grammar, Interview, Miscellaneous'],
        ['4. If Category is blank, the app will use the category you select on upload (default: Miscellaneous)'],
        ['5. Difficulty: BEGINNER | MEDIUM | ADVANCED (optional)'],
        ['6. Expected Answer is optional but improves AI scoring'],
        ['7. Save as .xlsx or .csv and upload on /questions/upload'],
      ]);
      help['!cols'] = [{ wch: 100 }];
      XLSX.utils.book_append_sheet(workbook, help, 'Instructions');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="question-upload-template.xlsx"'
      );
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };
}

export const questionBankController = new QuestionBankController();
