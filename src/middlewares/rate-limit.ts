import type { NextFunction, Request, Response } from 'express';
import rateLimiter from 'express-rate-limit';
import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';

import { AppError } from '../error';

/**
 * Configures a rate limiter middleware for Express routes to control the number of incoming requests.
 *
 * Rate limiting is essential for protecting endpoints from excessive requests, preventing spam and abuse,
 * and ensuring fair usage of server resources. This function integrates `express-rate-limit` with a Redis-based
 * storage layer to manage request counts across distributed environments, making it ideal for large-scale applications.
 *
 * This rate limiter:
 * - Tracks request counts in Redis with a specified key prefix, enabling separate rate limits for different routes or clients.
 * - Returns a `429 Too Many Requests` error if the limit is exceeded, with an error message indicating the retry time.
 * - Supports customizable settings for request limits, time windows, and Redis key prefixes.
 *
 * @param redis - A Redis instance, used to store and track request counts.
 * @param max - Maximum number of requests allowed within the specified time window.
 * @param prefix - A unique prefix for Redis keys used in rate limiting (e.g., "user", "api", or "admin"). Defaults to "common".
 * @param minutes - The duration, in minutes, for which the rate limit window is active. Defaults to 15 minutes.
 * @returns A configured rate limiter middleware for use in Express routes.
 */
const rateLimit = (
  redis: Redis,
  max: number,
  prefix = 'common',
  minutes = 15,
) => {
  /**
   * RedisStore setup:
   * - `prefix`: Custom prefix applied to each Redis key for rate-limited requests. This prefix enables
   *   distinct rate limits by endpoint or user type.
   * - `sendCommand`: Overridden to send Redis commands using ioredis. There’s a known TypeScript
   *   compatibility issue with the `call` method, hence the `@ts-expect-error` directive to bypass it.
   */
  const store = new RedisStore({
    prefix: `rl-${prefix}:`, // Prefix `rl-` ensures keys are identifiable as rate-limiting keys in Redis.
    // @ts-expect-error - Known TypeScript issue with ioredis `call` method in RedisStore.
    sendCommand: (...args: string[]) => redis.call(...args), // Custom command handler to support Redis interactions.
  });

  // Configure and return the `express-rate-limit` middleware instance with Redis-based storage.
  return rateLimiter({
    store, // Use RedisStore to persist request counts in Redis for distributed rate limiting.

    max, // Defines the maximum number of allowed requests within the `windowMs` time frame.

    // `windowMs` defines the time window for the rate limiter in milliseconds.
    // It converts the `minutes` parameter from minutes to milliseconds (minutes * 60 seconds * 1000 ms).
    windowMs: minutes * 60 * 1000,

    // `standardHeaders`: Enables the use of `RateLimit-*` headers to communicate rate limit status to clients.
    // These headers are part of modern HTTP rate-limiting standards, enhancing compatibility with client apps.
    standardHeaders: true,

    // `legacyHeaders`: Disables deprecated `X-Rate-Limit-*` headers to ensure the response uses only standardized headers.
    legacyHeaders: false,

    /**
     * Custom handler for rate-limited responses.
     *
     * This handler intercepts requests that exceed the rate limit and responds with a `429 Too Many Requests`
     * error. Using the `AppError` class, it provides a structured error message indicating the retry time.
     *
     * @param _ - The Express request object, unused in this handler.
     * @param __ - The Express response object, also unused here.
     * @param next - Express `next` function to pass the error to the centralized error-handling middleware.
     */
    handler(_: Request, __: Response, next: NextFunction) {
      // Generate a 429 Too Many Requests error with a retry message.
      // This error indicates that the client has exceeded the maximum allowed requests in the defined window.
      next(
        new AppError(
          `Too many requests! Please try again in ${minutes} minute(s)!`,
          429,
        ),
      );
    },
  });
};

export default rateLimit;
