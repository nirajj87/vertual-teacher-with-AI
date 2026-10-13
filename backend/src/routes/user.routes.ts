import { Router } from 'express';
import {
  userController,
  settingsController,
  dashboardController,
} from '../controllers/user.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import {
  updateProfileSchema,
  changePasswordSchema,
  updateSettingsSchema,
} from '../validators/user.validator';

const userRouter = Router();
const settingsRouter = Router();
const dashboardRouter = Router();

userRouter.use(authenticate);
settingsRouter.use(authenticate);
dashboardRouter.use(authenticate);

userRouter.get('/me', userController.getMe);
userRouter.patch('/me', validateBody(updateProfileSchema), userController.updateProfile);
userRouter.patch('/me/password', validateBody(changePasswordSchema), userController.changePassword);

settingsRouter.get('/', settingsController.getSettings);
settingsRouter.patch('/', validateBody(updateSettingsSchema), settingsController.updateSettings);

dashboardRouter.get('/stats', dashboardController.getStats);

export { userRouter, settingsRouter, dashboardRouter };
