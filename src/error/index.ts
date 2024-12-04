import type { NextFunction, Request, Response } from 'express';
import { getReasonPhrase } from 'http-status-codes';
import { nanoid } from 'nanoid';
import { ZodError } from 'zod';

import { asError } from '../util';

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
 * Custom error class designed to handle operational errors in a JSON:API-compliant format.
 * - Operational errors are predictable errors that occur due to client requests or expected conditions.
 */
export class AppError extends Error {
  // Unique identifier for the error instance, useful for tracking individual errors in logs.
  public id: string;

  // Short title describing the error (e.g., "Internal Server Error").
  public title: string;

  // Represents the nature of the error ('fail' for client errors, 'error' for server errors).
  public status: 'fail' | 'error';

  // HTTP status code for the error, compatible with common HTTP response codes.
  public statusCode: number;

  // Indicates if the error is operational, distinguishing it from critical, unexpected errors.
  public isOperational: boolean;

  // Custom error type to maintain compatibility with `http-errors` package or other similar conventions.
  public type: string;

  // Stack trace for debugging, only included in development mode.
  public error: Error;

  /**
   * Constructor initializes an AppError instance with a message and status code.
   * - Automatically determines the error's `status` based on the status code (4xx for `fail`, 5xx for `error`).
   * - Generates a unique ID for the error to help in logging and tracking issues.
   *
   * @param message - Human-readable message describing the error.
   * @param statusCode - HTTP status code to be sent in the response.
   */
  constructor(message: string, statusCode: number, error?: Error | unknown) {
    const safeError = asError(error || new Error());
    super(message, safeError); // Initialize the base Error class with the provided message.

    this.id = nanoid(); // Generate a unique identifier for tracking the specific error instance.
    this.title = getReasonPhrase(statusCode); // Use HTTP status code phrases for consistency in error descriptions.
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // Determine error type based on status code range.
    this.statusCode = statusCode;
    this.isOperational = true; // Marks the error as operational (not critical).
    this.type = 'operational.error';
    this.error = safeError;
    this.stack = safeError.stack;
  }
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
