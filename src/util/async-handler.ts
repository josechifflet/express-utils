import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Utility function to handle errors in asynchronous route handlers.
 *
 * Express does not automatically handle errors in asynchronous functions, requiring each
 * async route to handle errors individually. `asyncHandler` simplifies error handling by
 * wrapping asynchronous route handlers and passing any thrown errors to the next middleware
 * or error-handling function in the stack. This helps maintain clean, readable code, especially
 * in applications with multiple asynchronous routes.
 *
 * Usage:
 * - Wrap an async route handler with `asyncHandler`, and any errors within that handler will
 *   automatically propagate to the global error handler, eliminating the need for try-catch blocks.
 *
 * @param asyncRouteHandler - An Express asynchronous request handler (async function).
 * @returns A new function that catches and forwards errors to the next middleware.
 */
export const asyncHandler =
  (asyncRouteHandler: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) =>
    // Use Promise.resolve to handle both resolved and rejected promises from the async function.
    // If `asyncRouteHandler` throws an error, it is caught and forwarded to the next middleware (typically an error handler).
    Promise.resolve(asyncRouteHandler(req, res, next)).catch(next);

export default asyncHandler;
