import { Router } from 'express';
import { speechController } from '../controllers/speech.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { audioUploadMiddleware } from '../middleware/audioUpload.middleware';
import { aiRateLimit } from '../middleware/rateLimit.middleware';
import { synthesizeSchema, saveTranscriptSchema } from '../validators/speech.validator';

const router = Router();

router.use(authenticate);

router.get('/config', speechController.getConfig);
router.post('/transcribe', aiRateLimit, audioUploadMiddleware.single('audio'), speechController.transcribe);
router.post('/synthesize', aiRateLimit, validateBody(synthesizeSchema), speechController.synthesize);
router.post('/sessions/:sessionId/draft', validateBody(saveTranscriptSchema), speechController.saveDraft);
router.get('/sessions/:sessionId/draft', speechController.getDraft);

export default router;
