import { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import {
  AppError,
  defaultHandleOperationalErrors,
  errorHandler,
} from './index';

// Mock functions for request, response, and next
const mockRequest = {} as Request;
const mockResponse = {
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
} as unknown as Response;
const mockNext = vi.fn() as NextFunction;

// Test suite for AppError class
describe('AppError', () => {
  it('should create an AppError instance with correct properties', () => {
    const error = new Error('Test error');
    const appError = new AppError('Test message', 400, error);

    expect(appError).toBeInstanceOf(AppError);
    expect(appError.message).toBe('Test message');
    expect(appError.statusCode).toBe(400);
    expect(appError.status).toBe('fail');
    expect(appError.isOperational).toBe(true);
    expect(appError.error).toBe(error);
  });
});

// Test suite for defaultHandleOperationalErrors function
describe('defaultHandleOperationalErrors', () => {
  it('should handle SyntaxError and return AppError with status 400', () => {
    const syntaxError = new SyntaxError('Invalid JSON');
    const appError = defaultHandleOperationalErrors(syntaxError);

    expect(appError).toBeInstanceOf(AppError);
    expect(appError.statusCode).toBe(400);
    expect(appError.message).toBe('Invalid JSON! Please provide a valid one.');
  });

  it('should handle entity too large error and return AppError with status 413', () => {
    // @ts-expect-error - Conversion of type '{ type: string; }' to type 'Error' may be a mistake because neither type sufficiently overlaps with the other.
    const entityTooLargeError = { type: 'entity.too.large' } as Error;
    const appError = defaultHandleOperationalErrors(entityTooLargeError);

    expect(appError).toBeInstanceOf(AppError);
    expect(appError.statusCode).toBe(413);
    expect(appError.message).toBe(
      'Request too large! Please reduce your payload.',
    );
  });

  it('should handle ZodError and return AppError with status 400', () => {
    const zodError = new ZodError([]);
    const appError = defaultHandleOperationalErrors(zodError);

    expect(appError).toBeInstanceOf(AppError);
    expect(appError.statusCode).toBe(400);
    // Assuming formatZodError returns a specific string for empty issues
    expect(appError.message).toBe('Unknown Zod validation error');
  });

  it('should handle unknown errors and return AppError with status 500', () => {
    const unknownError = new Error('Unknown error');
    const appError = defaultHandleOperationalErrors(unknownError);

    expect(appError).toBeInstanceOf(AppError);
    expect(appError.statusCode).toBe(500);
    expect(appError.message).toBe('Internal server error!');
  });
});

// Test suite for errorHandler middleware
describe('errorHandler', () => {
  it('should handle AppError and send correct response', () => {
    const appError = new AppError('Test message', 400, new Error('Test error'));
    const handler = errorHandler({ environment: 'development' });

    handler(appError, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Test message',
      stack: appError.stack,
    });
  });

  it('should handle non-AppError and use default handler', () => {
    const error = new Error('Test error');
    const handler = errorHandler({ environment: 'production' });

    handler(error, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Internal server error!',
    });
  });

  it('should call next for unknown error types', () => {
    const unknownError = 'Unknown error';
    const handler = errorHandler({ environment: 'production' });

    handler(unknownError, mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
