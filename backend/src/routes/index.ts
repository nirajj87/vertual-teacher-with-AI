import { Router } from 'express';
import authRoutes from './auth.routes';
import { userRouter, settingsRouter, dashboardRouter } from './user.routes';
import questionBankRoutes from './questionBank.routes';
import practiceRoutes from './practice.routes';
import speechRoutes from './speech.routes';
import englishRoutes from './english.routes';
import interviewRoutes from './interview.routes';
import progressRoutes from './progress.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRouter);
router.use('/settings', settingsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/question-banks', questionBankRoutes);
router.use('/practice', practiceRoutes);
router.use('/speech', speechRoutes);
router.use('/english', englishRoutes);
router.use('/interview', interviewRoutes);
router.use('/progress', progressRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

export default router;
