import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Request error', err, { statusCode, code: err.code });

  const response: Record<string, unknown> = {
    error: statusCode >= 500 ? 'Internal Server Error' : err.name || 'Error',
    message: statusCode >= 500 && logger.isProduction()
      ? 'An unexpected error occurred' 
      : message,
  };

  if (err.code) {
    response.code = err.code;
  }

  if (logger.isDevelopment()) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(resource: string, id: string | number) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

