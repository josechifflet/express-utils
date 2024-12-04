import { NextFunction, Request, Response } from 'express';
import { errAsync, okAsync } from 'neverthrow';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { AppError } from '../error';
import {
  resultAsyncController,
  ResultAsyncRequestSchemas,
} from './result-async-controller';

// Mock functions for request, response, and next
const mockRequest = {} as Request;
const mockResponse = {
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
} as unknown as Response;
const mockNext = vi.fn() as NextFunction;

// Define test schemas
const paramsSchema = z.object({ id: z.string().uuid() });
const querySchema = z.object({ search: z.string().optional() });
const bodySchema = z.object({ name: z.string() });
const responseSchema = z.object({ message: z.string() });

// Test suite for resultAsyncController
describe('resultAsyncController', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should validate request and call callback with validated data', async () => {
    const schemas: ResultAsyncRequestSchemas<
      unknown,
      unknown,
      unknown,
      unknown
    > = {
      params: paramsSchema,
      query: querySchema,
      body: bodySchema,
      response: responseSchema,
    };

    const cb = vi.fn().mockReturnValue(okAsync({ message: 'Success' }));
    const controller = resultAsyncController(schemas, cb);

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
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: { message: 'Success' },
      status: 'success',
    });
  });

  it('should handle validation errors and pass them to next', async () => {
    const schemas: ResultAsyncRequestSchemas<
      unknown,
      unknown,
      unknown,
      unknown
    > = {
      params: paramsSchema,
      query: querySchema,
      body: bodySchema,
    };

    const cb = vi.fn().mockReturnValue(okAsync({ message: 'Success' }));
    const controller = resultAsyncController(schemas, cb);

    mockRequest.params = { id: 'invalid-uuid' };
    mockRequest.query = { search: 'test' };
    mockRequest.body = { name: 'Test' };

    await controller(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should handle callback errors and pass them to next', async () => {
    const schemas: ResultAsyncRequestSchemas<
      unknown,
      unknown,
      unknown,
      unknown
    > = {
      params: paramsSchema,
      query: querySchema,
      body: bodySchema,
    };

    const cb = vi
      .fn()
      .mockReturnValue(errAsync(new AppError('Callback error', 500)));
    const controller = resultAsyncController(schemas, cb);

    mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    mockRequest.query = { search: 'test' };
    mockRequest.body = { name: 'Test' };

    await controller(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should validate response if schema is provided', async () => {
    const schemas: ResultAsyncRequestSchemas<
      unknown,
      unknown,
      unknown,
      unknown
    > = {
      params: paramsSchema,
      query: querySchema,
      body: bodySchema,
      response: responseSchema,
    };

    const cb = vi.fn().mockReturnValue(okAsync({ message: 123 })); // Invalid response
    const controller = resultAsyncController(schemas, cb);

    mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    mockRequest.query = { search: 'test' };
    mockRequest.body = { name: 'Test' };

    await controller(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });

  it('should catch unexpected errors and pass them to next', async () => {
    const schemas: ResultAsyncRequestSchemas<
      unknown,
      unknown,
      unknown,
      unknown
    > = {
      params: paramsSchema,
      query: querySchema,
      body: bodySchema,
    };

    const cb = vi.fn().mockImplementation(() => {
      throw new Error('Unexpected');
    });
    const controller = resultAsyncController(schemas, cb);

    mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
    mockRequest.query = { search: 'test' };
    mockRequest.body = { name: 'Test' };

    await controller(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
  });
});
