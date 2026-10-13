import { Request, Response, NextFunction } from 'express';
import { progressService } from '../services/progress.service';
import { sendSuccess } from '../utils/apiResponse';

export class ProgressController {
  overview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await progressService.getOverview(req.user!.userId));
    } catch (error) {
      next(error);
    }
  };

  weakAreas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await progressService.getWeakAreas(req.user!.userId));
    } catch (error) {
      next(error);
    }
  };

  learningPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await progressService.getLearningPlan(req.user!.userId));
    } catch (error) {
      next(error);
    }
  };
}

export const progressController = new ProgressController();
