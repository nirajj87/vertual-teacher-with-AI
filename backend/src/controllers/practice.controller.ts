import { Request, Response, NextFunction } from 'express';
import { practiceService } from '../services/practice.service';
import { sendSuccess } from '../utils/apiResponse';
import { paramId } from '../utils/params';

export class PracticeController {
  getActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await practiceService.getActiveSession(req.user!.userId);
      sendSuccess(res, session);
    } catch (error) {
      next(error);
    }
  };

  start = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await practiceService.startSession(req.user!.userId, req.body);
      sendSuccess(res, session, 201);
    } catch (error) {
      next(error);
    }
  };

  getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await practiceService.getSession(paramId(req.params.sessionId), req.user!.userId);
      sendSuccess(res, session);
    } catch (error) {
      next(error);
    }
  };

  getCurrentQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await practiceService.getCurrentQuestion(
        paramId(req.params.sessionId),
        req.user!.userId
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  submitAnswer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await practiceService.submitAnswer(
        paramId(req.params.sessionId),
        req.user!.userId,
        req.body
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getHint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hint = await practiceService.getHint(paramId(req.params.sessionId), req.user!.userId);
      sendSuccess(res, hint);
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await practiceService.getSummary(paramId(req.params.sessionId), req.user!.userId);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await practiceService.completeSession(
        paramId(req.params.sessionId),
        req.user!.userId
      );
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  };

  abandon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await practiceService.abandonSession(paramId(req.params.sessionId), req.user!.userId);
      sendSuccess(res, { message: 'Session abandoned' });
    } catch (error) {
      next(error);
    }
  };

  history = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await practiceService.listHistory(req.user!.userId, page);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

export const practiceController = new PracticeController();
