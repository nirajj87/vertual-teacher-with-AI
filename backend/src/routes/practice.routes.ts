import { Router } from 'express';
import { practiceController } from '../controllers/practice.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { aiRateLimit } from '../middleware/rateLimit.middleware';
import { startPracticeSchema, submitAnswerSchema } from '../validators/question.validator';

const router = Router();

router.use(authenticate);

router.get('/active', practiceController.getActive);
router.get('/history', practiceController.history);
router.post('/sessions', validateBody(startPracticeSchema), practiceController.start);
router.get('/sessions/:sessionId', practiceController.getSession);
router.get('/sessions/:sessionId/current', practiceController.getCurrentQuestion);
router.post('/sessions/:sessionId/answer', aiRateLimit, validateBody(submitAnswerSchema), practiceController.submitAnswer);
router.post('/sessions/:sessionId/hint', aiRateLimit, practiceController.getHint);
router.get('/sessions/:sessionId/summary', practiceController.getSummary);
router.post('/sessions/:sessionId/complete', practiceController.complete);
router.post('/sessions/:sessionId/abandon', practiceController.abandon);

export default router;
