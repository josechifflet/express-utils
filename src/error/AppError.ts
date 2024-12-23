import { getReasonPhrase } from 'http-status-codes';
import { nanoid } from 'nanoid';

import { asError } from '../util/catch-unknown';

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
