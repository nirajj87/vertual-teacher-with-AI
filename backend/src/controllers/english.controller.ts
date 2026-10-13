import { Request, Response, NextFunction } from 'express';
import { englishService } from '../services/english.service';
import { sendSuccess } from '../utils/apiResponse';

export class EnglishController {
  overview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await englishService.getOverview(req.user!.userId));
    } catch (error) {
      next(error);
    }
  };

  correct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await englishService.correctSentence(req.user!.userId, req.body.text));
    } catch (error) {
      next(error);
    }
  };

  vocabulary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = parseInt(req.query.count as string) || 5;
      sendSuccess(res, await englishService.getVocabulary(req.user!.userId, count));
    } catch (error) {
      next(error);
    }
  };

  grammarTopics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await englishService.getGrammarTopics());
    } catch (error) {
      next(error);
    }
  };
}

export const englishController = new EnglishController();
