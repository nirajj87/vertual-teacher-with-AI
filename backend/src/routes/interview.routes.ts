import { Router } from 'express';
import { z } from 'zod';
import { interviewController } from '../controllers/interview.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { aiRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();
router.use(authenticate);

router.post(
  '/sessions',
  validateBody(
    z.object({
      interviewType: z.string().min(1),
      targetJob: z.string().optional(),
      experience: z.string().optional(),
      technology: z.string().optional(),
      company: z.string().optional(),
      difficulty: z.enum(['BEGINNER', 'MEDIUM', 'ADVANCED']).optional(),
      questionCount: z.number().min(3).max(20).optional(),
    })
  ),
  interviewController.start
);
router.get('/history', interviewController.history);
router.get('/analytics', interviewController.analytics);
router.post(
  '/sessions/:interviewId/complete',
  validateBody(z.object({ sessionId: z.string().uuid() })),
  interviewController.complete
);
router.post(
  '/feedback',
  aiRateLimit,
  validateBody(z.object({ question: z.string(), answer: z.string().min(1) })),
  interviewController.feedback
);

export default router;
