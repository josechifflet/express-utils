import type { NextFunction, Request, Response } from 'express';
import { JWTPayload, JWTVerifyResult } from 'jose';

import { verifyEdDSAJWT } from '@/core/rfc7519';
import { AppError } from '@/error';
import extractHeader from '@/util/extract-header';

/**
 * Middleware factory for validating JSON Web Tokens (JWT) in requests, ensuring user authorization/authentication.
 * 
 * This function validates a user's JWT by:
 * 1. Extracting the token from a specified request header.
 * 2. Verifying the token’s signature and claims against expected values (e.g., audience, issuer).
 * 3. Optionally invoking a callback function upon successful token validation, allowing further custom checks.
 * 
 * The `hasJWT` function returns an asynchronous middleware function. It uses a JWT public key for token verification 
 * and expects certain claims (e.g., session ID) to be present in the token. If the token is missing, invalid, 
 * or fails verification, an error is raised. Otherwise, the request is permitted to proceed to the next middleware.
 *
 * @param header - Name of the HTTP header from which to extract the JWT (e.g., "Authorization").
 * @param publicKey - The public key to verify the JWT’s signature (using EdDSA algorithm).
 * @param audience - Expected audience claim in the JWT to confirm the token’s intended recipients.
 * @param issuer - Expected issuer claim in the JWT to verify the token's origin.
 * @param onTokenValidated - Optional callback function, called if the token is valid. This can be used for additional checks.
 * @returns A middleware function that performs JWT validation.
 */
const hasJWT =
  (
    header: string,
    publicKey: string,
    audience: string,
    issuer: string,
    onTokenValidated: (decoded: JWTVerifyResult<JWTPayload>) => Promise<void>,
  ) =>
  /**
   * Middleware function to handle JWT extraction and verification.
   *
   * @param req - Express request object containing the incoming HTTP request data.
   * @param _ - Express response object (not used in this middleware).
   * @param next - Express `next` function to pass control to the next middleware or route handler.
   */
  async (req: Request, _: Response, next: NextFunction) => {
    // Extract the JWT from the specified request header (e.g., "Authorization").
    // - `extractHeader` is a utility function that retrieves the token based on the provided header name.
    // - If the token is missing, respond with a 401 Unauthorized error, indicating that authentication is required.
    const token = extractHeader(req, header);
    if (!token) {
      next(
        new AppError(
          'You do not possess an OTP session. Please verify your OTP by MFA.',
          401,
        ),
      );
      return; // Exit early if token is missing, as further checks cannot be performed.
    }

    // Verify the JWT using the provided public key, audience, and issuer.
    // - `verifyEdDSAJWT` performs cryptographic verification, ensuring the token's authenticity and integrity.
    // - If verification succeeds, `decoded` contains the decoded JWT payload, which includes claims like `jti` (JWT ID).
    const decoded = await verifyEdDSAJWT(token, publicKey, audience, issuer);

    // Check for the presence of a `jti` (JWT ID) in the payload, as this serves as a unique session identifier.
    // - `jti` is critical for identifying individual sessions, so a missing `jti` suggests an invalid or malformed token.
    // - If `jti` is absent, respond with a 401 Unauthorized error to prompt the client to re-authenticate.
    if (!decoded.payload.jti) {
      next(
        new AppError(
          'The JTI of the token is invalid. Please verify your session again.',
          401,
        ),
      );
      return; // Exit early if `jti` is missing, as this indicates a non-compliant token.
    }

    // If a callback function (`onTokenValidated`) is provided, execute it with the decoded token.
    // - This enables further validation or database checks (e.g., verifying the session ID in Redis).
    // - The callback function is asynchronous and should throw an error if validation fails,
    //   which would trigger the error-handling middleware in Express.
    if (onTokenValidated) await onTokenValidated(decoded);

    // If all checks pass, proceed to the next middleware or route handler.
    // - This grants access to the protected endpoint, as the user is considered authenticated and authorized.
    next();
  };

export default hasJWT;
