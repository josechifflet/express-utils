import type { NextFunction, Request, Response } from 'express';
import toobusy from 'toobusy-js';
import { AppError } from '@/error';

/**
 * Middleware to manage server load by checking if the server is too busy to handle additional requests.
 *
 * This middleware uses the `toobusy-js` library to monitor the server’s event loop lag, a measure
 * of how overwhelmed the server is. If the lag exceeds a specified threshold, the middleware will
 * respond with a 503 Service Unavailable error, signaling that the server is temporarily unable to
 * handle requests due to high load.
 *
 * This approach helps protect the server from overloading and ensures that users experience
 * minimal downtime by deferring requests during peak load times.
 *
 * @returns A middleware function that checks server load and sends a 503 response if the server is too busy.
 */
const busyHandler = () => (_: Request, __: Response, next: NextFunction) => {
  // Set the maximum acceptable event loop lag to 200 milliseconds.
  // - The event loop lag measures how long the event loop is blocked, indicating server load.
  // - If the lag exceeds this threshold, the server is considered too busy to accept new requests.
  // - 200ms is a conservative value, suitable for ensuring responsiveness under typical load.
  toobusy.maxLag(200);

  // Configure the interval at which the server checks for event loop lag.
  // - By setting this interval to 750 milliseconds, the server will evaluate its load at
  //   slightly less than once per second, balancing performance with load monitoring frequency.
  toobusy.interval(750);

  // Check if the server is too busy (i.e., if the event loop lag exceeds the configured maxLag).
  // - If `toobusy()` returns `true`, it indicates that the server’s load is too high, and the middleware
  //   should reject the request to avoid further strain on the system.
  if (toobusy()) {
    // If the server is too busy, send a 503 Service Unavailable error to the client.
    // - 503 is the standard HTTP response code for temporary unavailability due to overload.
    // - The error message advises the client to try again later, indicating a transient issue.
    next(
      new AppError('API is currently too busy. Please try again later!', 503),
    );
    return; // Exit early, as the request cannot proceed further.
  }

  // If the server load is acceptable, proceed to the next middleware or route handler.
  // This allows the request to be processed as usual if the server is not too busy.
  next();
};

export default busyHandler;
