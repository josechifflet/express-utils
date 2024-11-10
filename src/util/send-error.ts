import type { Request, Response } from 'express';

import { AppError } from '@/error';

/**
 * Options object parameters for configuring error responses.
 *
 * @property req - The Express request object, used to build the error source pointer.
 * @property res - The Express response object, used to send the JSON API-formatted error response.
 * @property error - The AppError instance, containing details about the error.
 * @property stack - Optional stack trace for debugging purposes, typically sent only in development.
 */
interface ErrorResponseOptions {
  req: Request;
  res: Response;
  error: AppError;
  stack?: string;
}

/**
 * Sends a structured JSON API-compliant error response.
 *
 * This function generates an error response formatted according to JSON API standards,
 * providing information such as status, status code, error ID, title, and message. Additionally,
 * it includes a `source` pointer to the exact URL where the error occurred, and optionally
 * includes the stack trace for debugging during development.
 *
 * @param options - An object of type `ErrorResponseOptions` containing details for the error response.
 * @returns Sends a JSON-formatted error response through the Express response object.
 */
const sendError = ({
  req,
  res,
  error,
  stack = undefined,
}: ErrorResponseOptions) =>
  res.status(error.statusCode).json({
    status: error.status,
    statusCode: error.statusCode,
    id: error.id,
    title: error.title,
    message: error.message,
    source: {
      // Construct the pointer URL from the request, indicating the exact endpoint of the error.
      pointer: `${req.protocol}://${req.hostname}${req.originalUrl}`,
    },

    // Include the stack trace if provided, typically only in development environments.
    stack,
  });

export default sendError;
