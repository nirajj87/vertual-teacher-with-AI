import { Request, Response, NextFunction } from 'express';
import { userService, dashboardService } from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';

export class UserController {
  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.getMe(req.user!.userId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await userService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await userService.changePassword(req.user!.userId, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

export class SettingsController {
  getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await userService.getSettings(req.user!.userId);
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await userService.updateSettings(req.user!.userId, req.body);
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  };
}

export class DashboardController {
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await dashboardService.getStats(req.user!.userId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  };
}

export const userController = new UserController();
export const settingsController = new SettingsController();
export const dashboardController = new DashboardController();
