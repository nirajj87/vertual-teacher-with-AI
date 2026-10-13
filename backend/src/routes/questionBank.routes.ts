import { Router } from 'express';
import { questionBankController } from '../controllers/questionBank.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import {
  createBankSchema,
  updateBankSchema,
  createQuestionSchema,
  importQuestionsSchema,
} from '../validators/question.validator';

const router = Router();

router.use(authenticate);

router.get('/', questionBankController.list);
router.post('/', validateBody(createBankSchema), questionBankController.create);

// Static upload routes BEFORE /:id so they are not captured as bank ids
router.get('/upload/template', questionBankController.downloadTemplate);
router.post('/upload/preview', uploadMiddleware.single('file'), questionBankController.uploadPreview);
router.post('/upload/confirm', validateBody(importQuestionsSchema), questionBankController.confirmImport);

router.get('/:id', questionBankController.get);
router.patch('/:id', validateBody(updateBankSchema), questionBankController.update);
router.delete('/:id', questionBankController.delete);

router.post('/:bankId/questions', validateBody(createQuestionSchema), questionBankController.addQuestion);
router.patch('/questions/:questionId', validateBody(createQuestionSchema.partial()), questionBankController.updateQuestion);
router.delete('/questions/:questionId', questionBankController.deleteQuestion);

export default router;
