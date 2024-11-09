import type { NextFunction, Request, Response } from 'express';
import { AppError } from '@/error';

/**
 * Middleware to validate that the client’s `Accept` header specifies a content type 
 * supported by the API. This helps enforce consistent communication formats, ensuring 
 * that clients expect JSON responses in a compatible format.
 * 
 * - The `Accept` header is a standard HTTP header that specifies the MIME types the client can handle.
 * - This middleware checks that the client’s `Accept` header includes either `application/json` 
 *   or `application/vnd.auth.v1+json` (a versioned MIME type for the API).
 * - If neither format is found, the middleware rejects the request with a 406 Not Acceptable status.
 *
 * @returns A middleware function that checks the `Accept` header and calls `next` with an error if unsupported.
 */
const accept = () => (req: Request, _: Response, next: NextFunction) => {
  const { accept } = req.headers;

  // Verify the `Accept` header in the request. If the header is missing or does not contain 
  // a compatible content type, this middleware denies access to the endpoint.
  // Supported content types:
  // - `application/json`: Standard JSON format for most API responses.
  // - `application/vnd.auth.v1+json`: A custom, versioned JSON format often used for APIs to 
  //    maintain compatibility across different versions of clients and services.
  if (
    !accept?.includes('application/json') &&
    !accept?.includes('application/vnd.auth.v1+json')
  ) {
    // If the `Accept` header does not specify a supported format, create an `AppError`.
    // This error signals that the server cannot fulfill the requested content type, as per HTTP spec:
    // - `406 Not Acceptable`: The client’s preferred response format (based on `Accept`) is unavailable.
    next(new AppError('API does not support the requested content type.', 406));
    return; // Stop execution here, as the request cannot be processed further.
  }

  // If the `Accept` header contains a supported format, call `next()` to continue to the next middleware
  // or route handler, allowing the request to proceed as expected.
  next();
};

export default accept;
