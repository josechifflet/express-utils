import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

/**
 * Middleware for validating request data (body, query, params) using a specified Zod schema.
 *
 * This middleware validates incoming request data against a provided Zod schema, which can define
 * expected shapes, types, and constraints for `body`, `query`, and `params` properties. If the data
 * does not match the schema, Zod will throw an error, automatically stopping the request. This helps
 * ensure that only valid data reaches the route handler, improving security and reducing errors.
 *
 * @param validationSchema - A Zod schema object used to validate the request data.
 * @returns An Express middleware function that validates the request.
 */
export const validateRequestSchema =
  (validationSchema: AnyZodObject) =>
  (request: Request, _response: Response, next: NextFunction) => {
    try {
      // Parse and validate the request data (body, query, and params) using the provided schema.
      // - `schema.parse` will throw an error if the request data does not meet schema requirements.
      const validatedData = validationSchema.parse({
        body: request.body,
        query: request.query,
        params: request.params,
      });

      // Assign the validated data back to the request object.
      // - This overwrites `req.body`, `req.query`, and `req.params` with the validated values.
      request.body = validatedData.body;
      request.query = validatedData.query;
      request.params = validatedData.params;

      // Proceed to the next middleware or route handler.
      return next();
    } catch (error) {
      // If validation fails, pass the error to the next middleware (error handler).
      next(error);
    }
  };

export default validateRequestSchema;
