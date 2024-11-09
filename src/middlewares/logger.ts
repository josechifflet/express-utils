import type { LoggerOptions } from 'express-winston';
import expressWinston from 'express-winston';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';

import getDeviceID from '@/util/get-device-id';

// Obtain the directory and file path for saving logs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration options for setting up loggers with `express-winston` and `winston`.
 *
 * This function creates a `LoggerOptions` object tailored for logging both successful and error responses 
 * in an Express.js application. Logs are saved in JSON format with additional request metadata, allowing 
 * for structured analysis and troubleshooting.
 *
 * @param filename - The name of the file where logs will be saved, ensuring separate logs for different purposes (e.g., traffic and errors).
 * @returns An object with configured options for the logger, passed into `express-winston`.
 */
const options = (filename: string): LoggerOptions => ({
  // Configure the logger to save logs in a file. If the file does not exist, it will be created automatically.
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', '..', 'logs', filename), // Define the log file location.
    }),
  ],

  // Use a JSON format for logs, with a timestamp to track each log entry.
  // - `timestamp` adds the exact time of each request, useful for sorting logs chronologically.
  // - `json` ensures structured logging, making it easier to parse logs programmatically.
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),

  // Enable request metadata in logs, including IP, user agent, and other request-specific information.
  meta: true,

  // Attach dynamic metadata for additional context, such as device information.
  // - `getDeviceID` extracts the device ID (if available) from the request, adding it to the log.
  dynamicMeta: (req) => ({ deviceInfo: getDeviceID(req) }),

  // Define a custom log message format, showing the HTTP method and URL path.
  // - `msg` uses a template string to log the request type (e.g., GET or POST) and endpoint.
  msg: 'HTTP {{req.method}} {{req.url}}',

  // Turn off colorization and Express-specific formatting for logs, as we use a custom JSON format.
  expressFormat: false,
  colorize: false,

  // Blacklist sensitive headers to avoid logging data like session IDs or tokens.
  // - Excludes headers that may contain sensitive information from logs.
  headerBlacklist: ['authorization', 'cookie'],

  // Exclude specific endpoints from logging to reduce noise from frequently called routes.
  // - `ignoredRoutes` lists routes with high call frequency, such as health or status checks, which are typically low in value for logs.
  ignoredRoutes: ['/api/v1/auth/status', '/api/v1/attendances/status'],

  // Specify which request attributes should be included in the logs for better context.
  // - `requestWhitelist` includes relevant request details such as URL, headers, and query parameters.
  requestWhitelist: [
    'url',
    'headers',
    'method',
    'httpVersion',
    'originalUrl',
    'query',
    'body',
  ],

  // Blacklist sensitive fields in the request body to prevent logging confidential information.
  // - `bodyBlacklist` specifies fields that should be excluded from logs, ensuring sensitive data such as passwords are not logged.
  bodyBlacklist: [
    'password',
    'currentPassword',
    'newPassword',
    'confirmPassword',
  ],
});

/**
 * Middleware for logging successful HTTP requests.
 * 
 * Uses `express-winston` to create a structured log entry for each request that results in a 
 * non-error response. Logs are saved in a traffic-specific file (`traffic.log`), aiding in the 
 * analysis of normal application behavior and user interactions.
 */
export const successLogger = expressWinston.logger(options('traffic.log'));

/**
 * Middleware for logging error responses.
 * 
 * This middleware captures requests that result in errors, creating a structured log entry 
 * in an error-specific file (`errors.log`). By separating error logs, this allows for focused 
 * troubleshooting and monitoring of issues without cluttering general traffic logs.
 */
export const errorLogger = expressWinston.errorLogger(options('errors.log'));
