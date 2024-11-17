import { RequestHandler } from 'express';
import { Request, Response } from 'express';
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

export const typedRequest =
  <TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown>(
    schemas: RequestSchemas<TParams, TQuery, TBody, TResponse>,
    cb: RequestCallback<TParams, TQuery, TBody, TResponse>,
    successStatusCode = 200,
  ): RequestHandler =>
  (req, res, next) => {
    const errors: ErrorListItem[] = [];
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
        errors.push({ type: 'Params', errors: parsedParams.error });
      }
    }

    // Validate body
    if (schemas.body) {
      const parsedBody = schemas.body.safeParse(req.body);
      if (parsedBody.success) {
        requestData.body = parsedBody.data;
      } else {
        errors.push({ type: 'Body', errors: parsedBody.error });
      }
    }

    // Validate query
    if (schemas.query) {
      const parsedQuery = schemas.query.safeParse(req.query);
      if (parsedQuery.success) {
        requestData.query = parsedQuery.data;
      } else {
        errors.push({ type: 'Query', errors: parsedQuery.error });
      }
    }

    // If there are validation errors, pass them to the next error handler
    if (errors.length > 0) {
      return next(errors);
    }

    // Run the callback with the validated data
    Promise.resolve(cb(requestData, req, res))
      .then((response: TResponse) => {
        // Validate response if schema is provided
        if (schemas.response) {
          const parsedResponse = schemas.response.safeParse(response);
          if (parsedResponse.success) {
            res.status(successStatusCode).json(parsedResponse.data);
          } else {
            errors.push({ type: 'Response', errors: parsedResponse.error });
            next(errors);
          }
        } else {
          // Send response if no response schema is defined
          res.status(successStatusCode).json(response);
        }
      })
      .catch(next);
  };
