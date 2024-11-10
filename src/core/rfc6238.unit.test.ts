import { describe, expect, it } from 'vitest';

import {
  generateDefaultTOTP,
  generateOwnOTP,
  generateTOTP,
  OTPParams,
  validateDefaultTOTP,
  validateTOTP,
  verifyOwnTOTP,
} from './rfc6238';

describe('TOTP Utility Functions', () => {
  const secret = 'JBSWY3DPEHPK3PXP'; // Example base32 secret key
  const issuer = 'TestApp';
  const label = 'test@example.com';
  const expectedUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}`;

  describe('generateDefaultTOTP', () => {
    it('should generate a 6-digit TOTP token and a valid URI', () => {
      const { token, uri } = generateDefaultTOTP(issuer, label, secret);
      expect(token).toHaveLength(6);
      expect(uri).toContain(expectedUri);
    });
  });

  describe('generateTOTP', () => {
    it('should generate a TOTP token and URI with custom parameters', () => {
      const params: OTPParams = {
        issuer,
        label,
        algorithm: 'SHA256',
        digits: 8,
        period: 60,
        secret,
      };
      const { token, uri } = generateTOTP(params);
      expect(token).toHaveLength(8);
      expect(uri).toContain(expectedUri);
      expect(uri).toContain('algorithm=SHA256');
      expect(uri).toContain('digits=8');
      expect(uri).toContain('period=60');
    });
  });

  describe('validateDefaultTOTP', () => {
    it('should validate a correct TOTP token', () => {
      const { token } = generateDefaultTOTP(issuer, label, secret);
      const isValid = validateDefaultTOTP(issuer, token, secret);
      expect(isValid).toBe(true);
    });

    it('should invalidate an incorrect TOTP token', () => {
      const isValid = validateDefaultTOTP(issuer, '123456', secret);
      expect(isValid).toBe(false);
    });
  });

  describe('validateTOTP', () => {
    it('should validate a TOTP token with custom parameters', () => {
      const params: OTPParams = {
        issuer,
        label,
        algorithm: 'SHA256',
        digits: 8,
        period: 60,
        secret,
      };
      const { token } = generateTOTP(params);
      const isValid = validateTOTP(token, params);
      expect(isValid).toBe(true);
    });

    it('should invalidate a TOTP token if it does not match the expected format', () => {
      const params: OTPParams = {
        issuer,
        label,
        algorithm: 'SHA256',
        digits: 8,
        period: 60,
        secret,
      };
      const isValid = validateTOTP('12345678', params);
      expect(isValid).toBe(false);
    });
  });

  describe('generateOwnOTP', () => {
    it('should generate a custom OTP token and URI', () => {
      const counter = Math.floor(Date.now() / 1000 / 30);
      const params: OTPParams = {
        issuer,
        label,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret,
      };
      const { token, uri } = generateOwnOTP(counter, params);
      expect(token).toHaveLength(6);
      expect(uri).toContain(`otpauth://totp/${issuer}:${label}`);
      expect(uri).toContain('algorithm=SHA1');
      expect(uri).toContain('digits=6');
      expect(uri).toContain('period=30');
    });
  });

  describe('verifyOwnTOTP', () => {
    it('should validate a custom OTP token generated with a matching counter', () => {
      const counter = Math.floor(Date.now() / 1000 / 30);
      const params: OTPParams = {
        issuer,
        label,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret,
      };
      const { token } = generateOwnOTP(counter, params);
      const isValid = verifyOwnTOTP(token, 1, params); // Window of 1 time step
      expect(isValid).toBe(true);
    });

    it('should invalidate a custom OTP token if it is outside the valid window', () => {
      const params: OTPParams = {
        issuer,
        label,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret,
      };
      const isValid = verifyOwnTOTP('654321', 1, params);
      expect(isValid).toBe(false);
    });
  });
});
