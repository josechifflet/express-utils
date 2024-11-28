import { RequestHandler } from 'express';
import { Request, Response } from 'express';
import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import { z, ZodFormattedError } from 'zod';

import { AppError, formatZodError } from '../error';

// Define types for request validation schemas
export type ResultAsyncRequestSchemas<TParams, TQuery, TBody, TResponse> = {
  params?: z.ZodType<TParams>;
  query?: z.ZodType<TQuery>;
  body?: z.ZodType<TBody>;
  response?: z.ZodType<TResponse>;
};

// Define type for validation errors
export interface ResultAsyncErrorListItem<TParams, TQuery, TBody> {
  type: 'Params' | 'Body' | 'Query' | 'Response';
  errors: ZodFormattedError<TParams | TQuery | TBody, string>;
}

// Define callback type with validated request data
export type ResultAsyncRequestCallback<TParams, TQuery, TBody, TResponse> = (
  data: { params: TParams; query: TQuery; body: TBody },
  req: Request,
  res: Response,
) => ResultAsync<TResponse, AppError>;

export const resultAsyncController =
  <TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    schemas: ResultAsyncRequestSchemas<TParams, TQuery, TBody, TResponse>,
    cb: ResultAsyncRequestCallback<TParams, TQuery, TBody, TResponse>,
    successStatusCode = 200,
  ): RequestHandler =>
  (req, res, next) => {
    const requestErrors: ResultAsyncErrorListItem<TParams, TQuery, TBody>[] =
      [];
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
        requestErrors.push({
          type: 'Params',
          errors: parsedParams.error.format(),
        });
      }
    }

    // Validate body
    if (schemas.body) {
      const parsedBody = schemas.body.safeParse(req.body);
      if (parsedBody.success) {
        requestData.body = parsedBody.data;
      } else {
        requestErrors.push({ type: 'Body', errors: parsedBody.error.format() });
      }
    }

    // Validate query
    if (schemas.query) {
      const parsedQuery = schemas.query.safeParse(req.query);
      if (parsedQuery.success) {
        requestData.query = parsedQuery.data;
      } else {
        requestErrors.push({
          type: 'Query',
          errors: parsedQuery.error.format(),
        });
      }
    }

    // If there are validation errors, pass them to the next error handler
    if (requestErrors.length > 0) {
      return next(new AppError('Bad request', 400, { errors: requestErrors }));
    }

    // Run the callback with the validated data
    cb(requestData, req, res)
      .andThen((response) => {
        // Validate response if schema is provided
        if (schemas.response) {
          const parsedResponse = schemas.response.safeParse(response);
          if (parsedResponse.success) {
            return okAsync(parsedResponse.data);
          } else {
            return errAsync(
              new AppError(formatZodError(parsedResponse.error), 500),
            );
          }
        } else {
          return okAsync(response);
        }
      })
      .then((result) => {
        if (result.isOk()) {
          res
            .status(successStatusCode)
            .json({ data: result.value, status: 'success' });
        } else {
          next(result.error);
        }
      });
  };
