import type { NextFunction, Request, Response } from 'express';
import { expressjwt } from 'express-jwt';
import { AppError } from '@/error';

/**
 * Middleware factory for verifying JSON Web Tokens (JWT) in protected routes.
 *
 * This middleware validates the JWT provided in incoming requests, ensuring it meets expected security
 * requirements such as a correct signature, audience, and issuer. This verification process is crucial
 * for safeguarding routes that require authenticated access. If the token has expired, an optional
 * callback can be invoked to handle expiration-specific logic.
 *
 * @param secret - Secret key for verifying the token's signature. This should match the signing key used for JWT creation.
 * @param audience - Expected audience claim in the token, ensuring the token was issued for the correct recipient.
 * @param issuer - Expected issuer claim in the token, verifying the token’s origin.
 * @param onExpired - Optional callback for handling expired tokens, allowing custom actions such as logging or alerting.
 *
 * @returns An Express middleware function to handle JWT verification for incoming requests.
 */
const verifySessionJwt =
  (
    secret: string,
    audience: string,
    issuer: string,
    onExpired?: (req: Request, err: unknown) => Promise<void>,
  ) =>
  /**
   * Middleware function for handling JWT validation.
   *
   * This middleware ensures that only authenticated requests (with a valid, non-expired JWT) are
   * granted access to protected routes. The JWT payload is extracted and stored in `req.auth` if valid.
   *
   * @param req - Express request object containing client data and the JWT in headers.
   * @param res - Express response object for sending responses back to the client.
   * @param next - Express `next` function to pass control to the next middleware or route handler.
   *
   * @returns Calls `next()` if the JWT is valid, otherwise throws an error.
   */
  (req: Request, res: Response, next: NextFunction) =>
    expressjwt({
      // Define the algorithms permitted for JWT verification. Here, only HS256 (HMAC with SHA-256) is allowed.
      algorithms: ['HS256'],

      // Set the secret key, which is necessary for decoding and verifying the token’s signature.
      secret,

      // Audience claim expected in the JWT. This ensures the token was issued specifically for this API or client.
      audience,

      // Issuer claim expected in the JWT, confirming the identity of the token’s issuer.
      issuer,

      // `complete: true` allows access to both the JWT payload and header. This is useful if header data is required.
      complete: true,

      /**
       * Custom handler for expired tokens.
       *
       * If the token is expired, this handler is triggered. If an `onExpired` callback is provided, it is invoked,
       * allowing custom handling of expiration events (e.g., logging). If no callback is provided, a 401 Unauthorized
       * error is thrown, indicating that re-authentication is required.
       *
       * @param _req - The Express request object, which contains client-specific data.
       * @param _err - The error object representing the expiration error, for use in custom handling.
       */
      onExpired: async (_req: Request, _err: unknown) => {
        if (onExpired) {
          // Execute the custom expiration handler, if provided.
          await onExpired(_req, _err);
        } else {
          // If no custom handler is provided, respond with a 401 Unauthorized error.
          throw new AppError(
            'You are not logged in yet! Please log in first!',
            401,
          );
        }
      },

      // `requestProperty` specifies where the decoded JWT payload will be attached on the request object.
      // By setting this to 'auth', the decoded JWT payload will be accessible via `req.auth` in subsequent middleware.
      requestProperty: 'auth',
    }).unless({
      // No paths are excluded from JWT verification, as this middleware is intended solely for protected routes.
      // By specifying an empty array, all requests passing through this middleware require a valid JWT.
      path: [],
    })(req, res, next);

export default verifySessionJwt;
