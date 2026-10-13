import { Router } from 'express';
import { progressController } from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', progressController.overview);
router.get('/weak-areas', progressController.weakAreas);
router.get('/learning-plan', progressController.learningPlan);

export default router;
