import { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { AppError } from '../error';
import { promiseController, RequestSchemas } from './promise-controller';

// Mock functions for request, response, and next
let mockRequest: Request;
let mockResponse: Response;
let mockNext: NextFunction;

beforeEach(() => {
  mockRequest = {} as Request;
  mockResponse = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  mockNext = vi.fn() as NextFunction;
});

// Define test schemas
const paramsSchema = z.object({ id: z.string().uuid() });
const querySchema = z.object({ search: z.string().optional() });
const bodySchema = z.object({ name: z.string() });
const responseSchema = z.object({ message: z.string() });

// Test suite for promiseController
describe('promiseController', () => {
  it('should validate request and call callback with validated data', async () => {
    const schemas: RequestSchemas<unknown, unknown, unknown, unknown> = {
      params: paramsSchema,
      query: querySchema,
      body: bodySchema,
      response: responseSchema,
    };

    const cb = vi.fn().mockResolvedValue({ message: 'Success' });
    const controller = promiseController(schemas, cb);

    mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    mockRequest.query = { search: 'test' };
    mockRequest.body = { name: 'Test' };

    await controller(mockRequest, mockResponse, mockNext);

    expect(cb).toHaveBeenCalledWith(
      {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        query: { search: 'test' },
        body: { name: 'Test' },
      },
      mockRequest,
      mockResponse,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Success' });
  });

  it('should handle validation errors and pass them to next', async () => {
    const schemas: RequestSchemas<unknown, unknown, unknown, unknown> = {
      params: paramsSchema,
      query: querySchema,
      body: bodySchema,
    };

    const cb = vi.fn().mockResolvedValue({ message: 'Success' });
    const controller = promiseController(schemas, cb);

    mockRequest.params = { id: 'invalid-uuid' };
    mockRequest.query = { search: 'test' };
    mockRequest.body = { name: 'Test' };

    await controller(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should handle callback errors and pass them to next', async () => {
    const schemas: RequestSchemas<unknown, unknown, unknown, unknown> = {
      params: paramsSchema,
      query: querySchema,
      body: bodySchema,
    };

    const cb = vi.fn().mockRejectedValue(new Error('Callback error'));
    const controller = promiseController(schemas, cb);

    mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    mockRequest.query = { search: 'test' };
    mockRequest.body = { name: 'Test' };

    await controller(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should validate response if schema is provided', async () => {
    const schemas: RequestSchemas<unknown, unknown, unknown, unknown> = {
      params: paramsSchema,
      query: querySchema,
      body: bodySchema,
      response: responseSchema,
    };

    const cb = vi.fn().mockResolvedValue({ message: 123 }); // Invalid response
    const controller = promiseController(schemas, cb);

    mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    mockRequest.query = { search: 'test' };
    mockRequest.body = { name: 'Test' };

    await controller(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should catch unexpected errors and pass them to next', async () => {
    const schemas: RequestSchemas<unknown, unknown, unknown, unknown> = {
      params: paramsSchema,
      query: querySchema,
      body: bodySchema,
    };

    const cb = vi.fn().mockImplementation(() => {
      throw new Error('Unexpected');
    });
    const controller = promiseController(schemas, cb);

    mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    mockRequest.query = { search: 'test' };
    mockRequest.body = { name: 'Test' };

    await controller(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });
});
