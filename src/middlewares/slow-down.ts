import expressSlowDown from 'express-slow-down';
import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';

/**
 * Configures and creates an instance of `express-slow-down` with Redis as the storage backend.
 * 
 * This middleware helps mitigate spamming and rapid consecutive requests by progressively slowing
 * down responses once a certain threshold of requests is reached. Using Redis as the storage layer
 * allows this middleware to function across distributed instances of the application, supporting 
 * scalability and preventing abuse in high-demand environments.
 *
 * The rate-limiting strategy:
 * - Allows a specified number of requests (`delayAfter`) within a 15-minute window.
 * - Once the threshold is reached, introduces an incremental delay on each subsequent request.
 * - Delay is calculated based on the number of requests over the limit, with a customizable delay per request.
 *
 * @param redis - An active Redis instance, used to store request counts and manage throttling limits.
 * @param delayAfter - Maximum allowed requests before throttling begins.
 * @returns Configured instance of `express-slow-down` middleware for global use.
 */
const slowDown = (redis: Redis, delayAfter: number) => {
  return expressSlowDown({
    /**
     * RedisStore setup for storing request counts and slow-down limits:
     * 
     * The RedisStore configuration provides a `prefix` for all keys used in rate limiting. 
     * - `prefix`: The key prefix (`sd-common:`) tags all keys associated with this middleware instance,
     *   making it easy to identify them in Redis and allowing separate keys for different middleware uses.
     * - `sendCommand`: Overrides Redis commands with `ioredis`. Known TypeScript compatibility issue
     *   (missing `call` in `@types/ioredis`) is handled with `@ts-expect-error`.
     */
    store: new RedisStore({
      prefix: 'sd-common:',
      // @ts-expect-error - TypeScript issue: `call` function missing in `@types/ioredis`
      sendCommand: (...args: string[]) => redis.call(...args),
    }),

    // `delayAfter` specifies the number of requests allowed within the time window (`windowMs`) 
    // before throttling applies. Once this limit is exceeded, the server introduces a delay on responses.
    delayAfter,

    // `windowMs` defines the time window, in milliseconds, for tracking requests. Here, it’s set to 
    // 15 minutes (15 * 60 * 1000 milliseconds), so that requests are counted within each 15-minute window.
    windowMs: 15 * 60 * 1000,

    /**
     * `delayMs`: Calculates the delay applied to each request after the `delayAfter` limit is reached.
     * 
     * This function dynamically computes the delay based on the number of requests beyond the allowed limit,
     * incrementally increasing the delay as more requests are made:
     * - `used`: Total number of requests made within the `windowMs` period.
     * - `req.slowDown.limit`: Retrieves the configured limit (i.e., `delayAfter`) for comparison.
     * 
     * Formula:
     * - Calculates delay as `(used - delayAfter) * 200`, applying a 200ms delay per extra request
     *   over the threshold, resulting in increasingly delayed responses to excessive requests.
     *
     * @param used - Total requests used in the current window.
     * @param req - The Express request object, carrying `slowDown` properties with limit configurations.
     * @returns Computed delay in milliseconds for the current request.
     */
    delayMs: (used, req) => {
      const delayAfter = req.slowDown.limit;
      return (used - delayAfter) * 200;
    },
  });
};

export default slowDown;
