import type { Request } from 'express';
import { importPKCS8, importSPKI, JWTPayload, jwtVerify, SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../error';
import {
  extractJWTFromAuthHeader,
  signEdDSAJWT,
  signHS256JWT,
  validateJWTPayload,
  verifyEdDSAJWT,
} from './rfc7519';

vi.mock('jose', () => {
  return {
    SignJWT: vi.fn(() => ({
      setProtectedHeader: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue('mockedToken'),
    })),
    importPKCS8: vi.fn(),
    importSPKI: vi.fn(),
    jwtVerify: vi.fn(),
  };
});

describe('JWT Utility Functions', () => {
  const secret = 'supersecret';
  const privateKey = 'privateKey';
  const publicKey = 'publicKey';
  const issuer = 'TestIssuer';
  const audience = 'TestAudience';
  const jti = 'uniqueIdentifier';
  const sub = 'subjectId';
  const expiration = 60; // 1 hour expiration

  beforeEach(() => {
    // @ts-expect-error - omit `Property 'mockResolvedValue' does not exist on type`
    jwtVerify.mockResolvedValue({
      payload: {
        iss: issuer,
        aud: audience,
        sub,
        jti,
        exp: Date.now() / 1000 + expiration * 60,
      },
    });
  });

  describe('signHS256JWT', () => {
    it('should sign a JWT with HS256 algorithm', async () => {
      const token = await signHS256JWT(
        secret,
        issuer,
        audience,
        jti,
        sub,
        expiration,
      );
      expect(SignJWT).toHaveBeenCalled();
      expect(token).toBe('mockedToken');
    });
  });

  describe('signEdDSAJWT', () => {
    it('should sign a JWT with EdDSA algorithm using a private key', async () => {
      // @ts-expect-error - omit `Property 'mockResolvedValue' does not exist on type`
      importPKCS8.mockResolvedValue('encodedPrivateKey');
      const token = await signEdDSAJWT(
        privateKey,
        issuer,
        audience,
        jti,
        sub,
        expiration,
      );
      expect(importPKCS8).toHaveBeenCalledWith(privateKey, 'EdDSA');
      expect(token).toBe('mockedToken');
    });
  });

  describe('verifyEdDSAJWT', () => {
    beforeEach(() => {
      // @ts-expect-error - omit `Property 'mockResolvedValue' does not exist on type`
      jwtVerify.mockResolvedValue({
        payload: {
          iss: issuer,
          aud: audience,
          sub,
          jti,
          exp: Date.now() / 1000 + expiration * 60,
        },
      });
    });

    it('should verify a JWT signed with EdDSA using a public key', async () => {
      // @ts-expect-error - omit `Property 'mockResolvedValue' does not exist on type`
      importSPKI.mockResolvedValue('encodedPublicKey');
      const result = await verifyEdDSAJWT(
        'mockedToken',
        publicKey,
        audience,
        issuer,
      );
      expect(importSPKI).toHaveBeenCalledWith(publicKey, 'EdDSA');
      expect(jwtVerify).toHaveBeenCalledWith(
        'mockedToken',
        'encodedPublicKey',
        { audience, issuer },
      );
      expect(result.payload).toMatchObject({ iss: issuer, aud: audience });
    });

    it('should throw an AppError if verification fails', async () => {
      // @ts-expect-error - omit `Property 'mockRejectedValue' does not exist on type`
      jwtVerify.mockRejectedValue(new Error('Verification failed'));
      await expect(
        verifyEdDSAJWT('invalidToken', publicKey, audience, issuer),
      ).rejects.toThrowError('Verification failed');
    });
  });

  describe('extractJWTFromAuthHeader', () => {
    it('should return the JWT token from the Authorization header', () => {
      const req = { headers: { authorization: 'Bearer testToken' } };
      const token = extractJWTFromAuthHeader(req as Request);
      expect(token).toBe('testToken');
    });

    it('should return undefined if Authorization header is not in the correct format', () => {
      const req = { headers: { authorization: 'Basic abc123' } };
      const token = extractJWTFromAuthHeader(req as Request);
      expect(token).toBeUndefined();
    });
  });

  describe('validateJWTPayload', () => {
    it('should validate a correct JWT payload structure', () => {
      const jwtPayload = {
        aud: audience,
        exp: Date.now() / 1000 + expiration * 60,
        iat: Date.now() / 1000,
        iss: issuer,
        jti,
        nbf: Date.now() / 1000,
        sub,
      };
      const validatedPayload = validateJWTPayload(jwtPayload);
      expect(validatedPayload).toEqual(jwtPayload);
    });

    it('should throw an error for an invalid JWT payload', () => {
      const invalidPayload = {
        aud: audience,
        exp: Date.now() / 1000 + expiration * 60,
        iat: Date.now() / 1000,
        iss: issuer,
        jti,
        // Missing required 'sub' claim
        nbf: Date.now() / 1000,
      };
      expect(() => validateJWTPayload(invalidPayload as JWTPayload)).toThrow(
        AppError,
      );
    });
  });
});
