import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../error';

/**
 * Middleware to prevent Cross-Site Tracing (XST) by restricting HTTP methods to a safe, predefined set.
 *
 * Cross-Site Tracing (XST) is an attack technique where HTTP TRACE requests can be exploited to access
 * potentially sensitive information in headers or request bodies. By disallowing unsupported methods such as TRACE,
 * this middleware mitigates XST risks and ensures that only explicitly allowed HTTP methods are processed by the API.
 *
 * Allowed HTTP methods are limited to common request types used in REST APIs:
 * - OPTIONS: For CORS preflight requests.
 * - HEAD: Retrieves headers without the body.
 * - CONNECT: Establishes a tunnel (used primarily for HTTPS).
 * - GET, POST, PATCH, PUT, DELETE: Standard CRUD operations.
 *
 * @returns A middleware function that restricts HTTP methods to prevent XST attacks.
 */
export const xst = () => (req: Request, _: Response, next: NextFunction) => {
  // Define the list of allowed HTTP methods to mitigate risks of XST attacks.
  // - Limiting methods to this set restricts unsupported methods like TRACE that are susceptible to exploitation.
  // - Only these methods are permitted for API routes, reducing the attack surface.
  const allowedMethods = [
    'OPTIONS', // For CORS and preflight requests.
    'HEAD', // Retrieves metadata without a response body.
    'CONNECT', // For creating a network tunnel, generally for HTTPS.
    'GET', // Standard retrieval of resources.
    'POST', // Creates a new resource.
    'PATCH', // Applies partial updates to a resource.
    'PUT', // Replaces a resource.
    'DELETE', // Deletes a resource.
  ];

  // Check if the incoming request method is included in the allowedMethods array.
  // - If the method is not allowed, respond with a 405 Method Not Allowed error, signaling that
  //   the method used in the request is not supported by the server.
  if (!allowedMethods.includes(req.method)) {
    // Use AppError to provide a clear error response, specifying that the method is not permitted.
    // - `405 Method Not Allowed` is an appropriate status for requests using unsupported HTTP methods.
    next(new AppError(`Method ${req.method} is not allowed in this API!`, 405));
    return; // Exit early as the request method does not meet the allowed criteria.
  }

  // If the method is allowed, proceed to the next middleware or route handler.
  next();
};

export default xst;
