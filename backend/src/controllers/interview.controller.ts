import { Request, Response, NextFunction } from 'express';
import { interviewService } from '../services/interview.service';
import { sendSuccess } from '../utils/apiResponse';
import { paramId } from '../utils/params';

export class InterviewController {
  start = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await interviewService.start(req.user!.userId, req.body), 201);
    } catch (error) {
      next(error);
    }
  };

  history = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      sendSuccess(res, await interviewService.listHistory(req.user!.userId, page));
    } catch (error) {
      next(error);
    }
  };

  analytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await interviewService.getAnalytics(req.user!.userId));
    } catch (error) {
      next(error);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(
        res,
        await interviewService.completeInterview(
          paramId(req.params.interviewId),
          req.user!.userId,
          req.body.sessionId
        )
      );
    } catch (error) {
      next(error);
    }
  };

  feedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(
        res,
        await interviewService.feedbackOnAnswer(
          req.user!.userId,
          req.body.question,
          req.body.answer
        )
      );
    } catch (error) {
      next(error);
    }
  };
}

export const interviewController = new InterviewController();
