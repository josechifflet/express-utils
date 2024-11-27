import type { Request } from 'express';
import type { JWTHeaderParameters, JWTPayload, JWTVerifyOptions } from 'jose';
import { decodeJwt, importPKCS8, importSPKI, jwtVerify, SignJWT } from 'jose';
import { z } from 'zod';

import { AppError } from '../error';
import { asError } from '../util/catch-unknown';

/**
 * Signs a JWT with HS256 (symmetric algorithm) for session-based authentication.
 * HS256 uses a shared secret for signing.
 *
 * @param secret - Shared secret for signing.
 * @param issuer - The entity issuing the token.
 * @param audience - Intended audience for the token.
 * @param jti - Unique identifier for the token (JWT ID).
 * @param sub - Subject of the JWT, typically the user ID.
 * @param expiration - Expiration time in minutes.
 * @returns The signed JWT as a string.
 */
export const signHS256JWT = async (
  secret: string,
  issuer: string,
  audience: string,
  jti: string,
  sub: string,
  expiration: number,
) => {
  // Encode the shared secret for HS256 signing
  const secretEncoded = new TextEncoder().encode(secret);

  // Define JWT payload with standard claims per RFC 7519
  const payload: JWTPayload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + expiration * 60,
    iat: Math.floor(Date.now() / 1000),
    iss: issuer,
    jti,
    nbf: Math.floor(Date.now() / 1000),
    sub,
  };

  // Specify headers for HS256
  const headers: JWTHeaderParameters = {
    alg: 'HS256',
    typ: 'JWT',
  };

  // Generate the signed JWT
  return new SignJWT(payload).setProtectedHeader(headers).sign(secretEncoded);
};

/**
 * Signs a JWT using EdDSA (asymmetric algorithm), ideal for public-private key scenarios.
 *
 * @param privateKey - Private key for signing.
 * @param issuer - The entity issuing the token.
 * @param audience - Intended audience for the token.
 * @param jti - Unique identifier for the token (JWT ID).
 * @param sub - Subject of the JWT, typically the user ID.
 * @param expiration - Expiration time in minutes.
 * @returns The signed JWT (JWS) as a string.
 */
export const signEdDSAJWT = async (
  privateKey: string,
  issuer: string,
  audience: string,
  jti: string,
  sub: string,
  expiration: number,
) => {
  // Import the private key for EdDSA signing
  const privateKeyEncoded = await importPKCS8(privateKey, 'EdDSA');

  // Define JWT payload with standard claims
  const payload: JWTPayload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + expiration * 60,
    iat: Math.floor(Date.now() / 1000),
    iss: issuer,
    jti,
    nbf: Math.floor(Date.now() / 1000),
    sub,
  };

  const headers: JWTHeaderParameters = {
    alg: 'EdDSA',
    typ: 'JWT',
  };

  // Generate and sign the JWT
  return new SignJWT(payload)
    .setProtectedHeader(headers)
    .sign(privateKeyEncoded);
};

/**
 * Verifies and decodes a JWT using EdDSA and a public key, ensuring it matches the expected issuer and audience.
 *
 * @param token - The JWT to verify.
 * @param publicKey - Public key for verification.
 * @param audience - Expected audience of the JWT.
 * @param issuer - Expected issuer of the JWT.
 * @returns Decoded and verified JWT payload.
 * @throws AppError if verification fails.
 */
export const verifyEdDSAJWT = async (
  token: string,
  publicKey: string,
  audience: string,
  issuer: string,
) => {
  try {
    // Import the public key for verification
    const publicKeyEncoded = await importSPKI(publicKey, 'EdDSA');

    const options: JWTVerifyOptions = {
      audience,
      issuer,
    };

    // Verify and decode the token
    return jwtVerify(token, publicKeyEncoded, options);
  } catch (error) {
    throw new AppError(asError(error).name, 401);
  }
};

/**
 * Extracts a JWT from the Authorization header in an Express request.
 * Assumes the format "Bearer <token>".
 *
 * @param req - Express request object.
 * @returns The extracted JWT as a string, or undefined if not present.
 */
export const extractJWTFromAuthHeader = (req: Request): string | undefined => {
  const { authorization } = req.headers;

  if (authorization?.startsWith('Bearer ')) {
    // Extract and return the JWT from "Bearer <token>"
    return authorization.split(' ')[1];
  }

  return undefined;
};

/**
 * Validates the structure of a JWT payload, ensuring required claims per RFC 7519.
 *
 * @param jwtPayload - The JWT payload to validate.
 * @returns The validated JWT payload object.
 * @throws AppError if the payload does not conform to the expected schema.
 */
export const validateJWTPayload = (jwtPayload: JWTPayload) => {
  // Define the expected JWT payload schema
  const JWTPayloadSchema = z.object({
    aud: z.string(),
    exp: z.number(),
    iat: z.number(),
    iss: z.string(),
    jti: z.string(),
    nbf: z.number(),
    sub: z.string(),
  });

  // Validate the payload using Zod
  const validation = JWTPayloadSchema.safeParse(jwtPayload);
  if (!validation.success) {
    throw new AppError('Invalid JWT payload', 401);
  }

  return validation.data;
};

/**
 * Decodes and validates a JWT payload.
 * @param token - The JWT to decode and validate.
 * @returns The validated JWT payload object.
 */
export const decodeJWTPayload = (token: string) => {
  const jwtPayload: JWTPayload = decodeJwt(token);

  return validateJWTPayload(jwtPayload);
};
