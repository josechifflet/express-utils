import type { NextFunction, Request, Response } from 'express';
import { AppError } from '@/error';

/**
 * Middleware to handle `404 Not Found` errors for unmatched routes in the API.
 * 
 * This middleware acts as a catch-all for requests that do not match any defined route.
 * When a request is made to a URL that the server does not recognize, this middleware
 * generates a `404 Not Found` error, indicating that the requested resource is unavailable.
 * 
 * This approach centralizes `404` handling, providing a consistent error response for
 * all undefined routes and helping users identify incorrect URLs.
 *
 * @returns A middleware function that creates a `404 Not Found` error.
 */
const notFound = () => (req: Request, _: Response, next: NextFunction) => {
  // Forward a new `AppError` instance to Express's error-handling pipeline.
  // - `req.originalUrl` contains the full path of the requested URL, making the error message
  //   more informative by specifying the exact route that could not be found.
  // - `404` is the standard HTTP status code for a resource that could not be located.
  next(new AppError(`Cannot find '${req.originalUrl}' on this server!`, 404));
};

export default notFound;
