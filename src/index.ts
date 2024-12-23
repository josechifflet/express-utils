// API
export { Api, type ApiOptions } from './api/index';

// Server
export { type ExpressAppStarterOptions, Server } from './server/index';

// Errors
export {
  AppError,
  errorHandler,
  type ErrorHandlerConfig,
  formatZodError,
} from './error/index';

// Redis
export { Redis } from './redis/index';

// Middlewares
export { accept } from './middlewares/accept';
export { bodyParser } from './middlewares/body-parser';
export { busyHandler } from './middlewares/busy-handler';
export { favicon } from './middlewares/favicon';
export { hasJWT } from './middlewares/has-jwt';
export { errorLogger, successLogger } from './middlewares/logger';
export { notFound } from './middlewares/not-found';
export { rateLimit } from './middlewares/rate-limit';
export { slowDown } from './middlewares/slow-down';
export { validateRequestSchema } from './middlewares/validate-request-schema';
export { verifySessionJwt } from './middlewares/verify-session-jwt';
export { xRequestedWith } from './middlewares/x-requested-with';
export { xst } from './middlewares/xst';

// Utils
export { asyncHandler } from './util/async-handler';
export { asError, isError } from './util/catch-unknown';
export { extractHeader } from './util/extract-header';
export { generateRandomHex } from './util/generate-random-hex';
export { getDeviceID } from './util/get-device-id';
export { isHTTPS } from './util/is-https';
export { hashPassword, verifyPassword } from './util/passwords';
export { promiseController } from './util/promise-controller';
export { resultAsyncController } from './util/result-async-controller';
export { timingSafeStringCompare } from './util/timing-safe-string-compare';

// RFC 6238: Time-Based One-Time Password (TOTP)
export {
  generateDefaultTOTP,
  generateOwnOTP,
  generateTOTP,
  type OTPParams,
  validateDefaultTOTP,
  validateTOTP,
  verifyOwnTOTP,
} from './core/rfc6238';

// RFC 7519: JSON Web Token (JWT)
export {
  decodeJWTPayload,
  extractJWTFromAuthHeader,
  signEdDSAJWT,
  signHS256JWT,
  validateJWTPayload,
  verifyEdDSAJWT,
} from './core/rfc7519';

// RFC 7617: Basic Authentication
export { createBasicAuth, parseBasicAuth } from './core/rfc7617';
