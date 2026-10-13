import { Router } from 'express';
import { z } from 'zod';
import { englishController } from '../controllers/english.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';

const router = Router();
router.use(authenticate);

router.get('/overview', englishController.overview);
router.get('/vocabulary', englishController.vocabulary);
router.get('/grammar/topics', englishController.grammarTopics);
router.post(
  '/correct',
  validateBody(z.object({ text: z.string().min(1).max(5000) })),
  englishController.correct
);

export default router;
