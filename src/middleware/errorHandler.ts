import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../types';

/**
 * Centralized Express error-handler middleware.
 *
 * Must be registered AFTER all routes (4-argument signature signals Express).
 * Returns a consistent JSON envelope: { error, message, [detail] }
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error & { code?: string; detail?: string; status?: number },
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (process.env.NODE_ENV !== 'test') {
    console.error('[ErrorHandler]', err.message);
  }

  // PostgreSQL: unique-constraint violation (duplicate key)
  if (err.code === '23505') {
    res.status(409).json({
      error: 'Conflict',
      message: 'A record with one or more unique fields already exists.',
      detail: err.detail,
    });
    return;
  }

  // PostgreSQL: foreign-key violation
  if (err.code === '23503') {
    res.status(404).json({
      error: 'Not Found',
      message: 'Referenced resource does not exist.',
      detail: err.detail,
    });
    return;
  }

  // PostgreSQL: check-constraint violation (e.g. quantity < 0)
  if (err.code === '23514') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'A check constraint was violated.',
      detail: err.detail,
    });
    return;
  }

  // Application-level HttpError with explicit status
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.name,
      message: err.message,
    });
    return;
  }

  // Fallback — unexpected server error
  res.status(500).json({
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred.'
        : err.message,
  });
}
