import { RequestHandler } from 'express';
import { Request, Response } from 'express';
import { AppError } from 'src/error';
import { z, ZodError } from 'zod';

// Define types for request validation schemas
export type RequestSchemas<TParams, TQuery, TBody, TResponse> = {
  params?: z.ZodType<TParams>;
  query?: z.ZodType<TQuery>;
  body?: z.ZodType<TBody>;
  response?: z.ZodType<TResponse>;
};

// Define type for validation errors
export type ErrorListItem = {
  type: 'Params' | 'Body' | 'Query' | 'Response';
  errors: ZodError;
};

// Define callback type with validated request data
export type RequestCallback<TParams, TQuery, TBody, TResponse> = (
  data: { params: TParams; query: TQuery; body: TBody },
  req: Request,
  res: Response,
) => Promise<TResponse> | TResponse;

export const promiseController =
  <TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    schemas: RequestSchemas<TParams, TQuery, TBody, TResponse>,
    cb: RequestCallback<TParams, TQuery, TBody, TResponse>,
    successStatusCode = 200,
  ): RequestHandler =>
  async (req, res, next) => {
    const requestErrors: ErrorListItem[] = [];
    const requestData = {
      params: {} as TParams,
      body: {} as TBody,
      query: {} as TQuery,
    };

    // Validate params
    if (schemas.params) {
      const parsedParams = schemas.params.safeParse(req.params);
      if (parsedParams.success) {
        requestData.params = parsedParams.data;
      } else {
        requestErrors.push({ type: 'Params', errors: parsedParams.error });
      }
    }

    // Validate body
    if (schemas.body) {
      const parsedBody = schemas.body.safeParse(req.body);
      if (parsedBody.success) {
        requestData.body = parsedBody.data;
      } else {
        requestErrors.push({ type: 'Body', errors: parsedBody.error });
      }
    }

    // Validate query
    if (schemas.query) {
      const parsedQuery = schemas.query.safeParse(req.query);
      if (parsedQuery.success) {
        requestData.query = parsedQuery.data;
      } else {
        requestErrors.push({ type: 'Query', errors: parsedQuery.error });
      }
    }

    // If there are validation errors, pass them to the next error handler
    if (requestErrors.length > 0) {
      return next(new AppError('Bad request', 400, requestErrors));
    }

    // Run the callback with the validated data using await promise
    try {
      const result = await cb(requestData, req, res);

      // If the response schema is provided, validate the response
      if (schemas.response) {
        const parsedResponse = schemas.response.safeParse(result);
        if (!parsedResponse.success) {
          return next(new AppError('Bad response', 500, parsedResponse.error));
        }
      }

      // Send the response
      res.status(successStatusCode).json(result);
    } catch (error) {
      next(new AppError('Unknown error! Please try again later!', 500, error));
    }
  };
