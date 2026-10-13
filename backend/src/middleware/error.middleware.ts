import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] || 'unknown';

  if (err instanceof AppError) {
    sendError(res, err.message, err.code, err.statusCode, err.errors);
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Validation failed', 'VALIDATION_ERROR', 422, errors);
    return;
  }

  logger.error('Unhandled error', {
    requestId,
    error: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  sendError(
    res,
    env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    'INTERNAL_ERROR',
    500
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.path} not found`, 'NOT_FOUND', 404);
}
