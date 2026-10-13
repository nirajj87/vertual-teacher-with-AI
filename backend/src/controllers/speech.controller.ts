import { Request, Response, NextFunction } from 'express';
import { speechService } from '../speech/speech.service';
import { sendSuccess } from '../utils/apiResponse';
import { paramId } from '../utils/params';

export class SpeechController {
  getConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, speechService.getConfig());
    } catch (error) {
      next(error);
    }
  };

  transcribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No audio file uploaded', code: 'VALIDATION_ERROR' });
        return;
      }

      const sessionId = req.body.sessionId as string | undefined;
      const language = req.body.language as string | undefined;

      const result = await speechService.transcribe(
        req.user!.userId,
        req.file.path,
        req.file.mimetype,
        language,
        sessionId
      );

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  synthesize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await speechService.synthesize(req.user!.userId, req.body.text, {
        voice: req.body.voice,
        speed: req.body.speed,
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  saveDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await speechService.saveDraftTranscript(
        paramId(req.params.sessionId),
        req.user!.userId,
        req.body.transcript
      );
      sendSuccess(res, { message: 'Draft saved' });
    } catch (error) {
      next(error);
    }
  };

  getDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const draft = await speechService.getSessionTranscript(
        paramId(req.params.sessionId),
        req.user!.userId
      );
      sendSuccess(res, draft);
    } catch (error) {
      next(error);
    }
  };
}

export const speechController = new SpeechController();
