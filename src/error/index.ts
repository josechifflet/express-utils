import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from './AppError';

/**
 * Configuration options for the error handler function.
 * - `environment`: Specifies whether the app is running in development or production mode, affecting error responses.
 * - `handleOperationalErrors`: Optional function to process known operational errors before response.
 */
export interface ErrorHandlerConfig {
  environment: 'development' | 'production';
  handleOperationalErrors?: (err: Error) => AppError;
}

/**
 * Formats errors returned by Zod schema validation to extract meaningful feedback for the client.
 * - Returns the specific path and message of the first issue for clarity.
 *
 * @param error - ZodError instance, representing the schema validation error.
 * @returns A formatted error message string for client display.
 */
export const formatZodError = (error: ZodError): string => {
  const { issues } = error; // Extracts issues array from ZodError.
  if (issues.length) {
    const { path, message } = issues[0]; // Get the first issue to report the most immediate validation failure.
    const pathString = path.join('.'); // Convert path array to a string, representing the field with an error.
    return `${pathString}: ${message}`; // Format as "field: message" for readability.
  }
  return 'Unknown Zod validation error'; // Fallback message for unexpected Zod errors.
};

/**
 * Default handler for known operational errors, converting common error types to AppError instances.
 * - Provides detailed error messages for predictable errors (e.g., JSON parsing errors).
 *
 * @param err - An error instance to process.
 * @returns An AppError instance with a formatted message and appropriate status code.
 */
export const defaultHandleOperationalErrors = (err: Error): AppError => {
  // Handle JSON parsing errors with a 400 Bad Request response.
  if (err instanceof SyntaxError) {
    return new AppError('Invalid JSON! Please provide a valid one.', 400, err);
  }

  // Handle payload too large errors, commonly caused by oversized client requests.
  if ('type' in err && err.type === 'entity.too.large') {
    return new AppError(
      'Request too large! Please reduce your payload.',
      413,
      err,
    );
  }

  // Convert Zod schema validation errors to a structured AppError with field-specific feedback.
  if (err instanceof ZodError) {
    return new AppError(formatZodError(err), 400, err);
  }

  console.error(err); // Log unknown errors for troubleshooting during development.
  return new AppError('Internal Server Error!', 500, err);
};

/**
 * Middleware for handling errors globally, using configurations from ErrorHandlerConfig.
 * - Customizes error responses based on environment (development or production) and error type.
 *
 * @param config - Configuration for error handling, including environment and optional error processing function.
 * @returns An Express middleware function to manage error responses.
 */
export const errorHandler = (config: ErrorHandlerConfig) => {
  const { environment, handleOperationalErrors } = config;

  // Middleware function to handle errors in the request-response lifecycle.
  return (
    err: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    /**
     * Internal function to send a JSON-formatted error response to the client.
     * - Includes error message, status, and optionally the stack trace in development mode.
     *
     * @param error - An AppError instance containing error details for the response.
     */
    const sendErrorResponse = (error: AppError) => {
      const response = {
        status: 'error', // Indicates a server-side or application-level failure.
        message: error.message, // Provide the error message for client feedback.
        ...(environment === 'development' && { stack: error.stack }), // Include stack trace only in development.
      };
      res.status(error.statusCode).json(response); // Send structured JSON response with appropriate HTTP status.
    };

    // Directly handle known AppError instances, created for operational errors.
    if (err instanceof AppError) {
      sendErrorResponse(err);
      return;
    }

    // Process other Error instances (non-AppError), potentially using a custom handler.
    if (err instanceof Error) {
      // Use custom handler if provided to convert error into AppError; otherwise, use default handler.
      const operationalError = handleOperationalErrors?.(err);
      if (operationalError) sendErrorResponse(operationalError);
      else sendErrorResponse(defaultHandleOperationalErrors(err));
      return;
    }

    // Fallback for unknown error types (not an instance of Error or AppError).
    // This serves as a last resort to ensure all errors have a response.
    const unknownError = new AppError(
      'Unknown error! Please try again later.',
      500,
      err,
    );
    console.error('Unknown error:', err); // Log unknown errors for investigation.
    sendErrorResponse(unknownError);

    next(); // Continue to the next middleware, if any (usually not needed after sending a response).
  };
};

export { AppError };
