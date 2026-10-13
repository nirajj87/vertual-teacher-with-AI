import { Response } from 'express';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Array<{ field: string; message: string }>;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data } satisfies ApiSuccessResponse<T>);
}

export function sendError(
  res: Response,
  message: string,
  code: string,
  statusCode = 400,
  errors?: Array<{ field: string; message: string }>
): void {
  res.status(statusCode).json({
    success: false,
    message,
    code,
    errors,
  } satisfies ApiErrorResponse);
}
