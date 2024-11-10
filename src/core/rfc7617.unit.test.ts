import { describe, expect, it } from 'vitest';

import { createBasicAuth, parseBasicAuth } from './rfc7617';

describe('Basic Authorization Functions', () => {
  describe('createBasicAuth', () => {
    it('should create a valid Basic Authorization header', () => {
      const username = 'testUser';
      const password = 'testPassword';
      const result = createBasicAuth(username, password);

      // Expected output: "Basic <Base64(username:password)>"
      const expected = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
      expect(result).toBe(expected);
    });

    it('should handle usernames and passwords with special characters', () => {
      const username = 'user!@#';
      const password = 'pass$%^';
      const result = createBasicAuth(username, password);

      const expected = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
      expect(result).toBe(expected);
    });

    it('should handle empty username and password', () => {
      const result = createBasicAuth('', '');
      expect(result).toBe('Basic ' + Buffer.from(':').toString('base64'));
    });
  });

  describe('parseBasicAuth', () => {
    it('should parse a valid Basic Authorization header', () => {
      const username = 'testUser';
      const password = 'testPassword';
      const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
      const result = parseBasicAuth(authHeader);

      expect(result).toEqual({ username, password });
    });

    it('should handle passwords containing colons', () => {
      const username = 'testUser';
      const password = 'pass:word';
      const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
      const result = parseBasicAuth(authHeader);

      expect(result).toEqual({ username, password });
    });

    it('should throw an error for invalid Basic Authorization format', () => {
      const invalidAuthHeader = 'Bearer dGVzdFVzZXI6dGVzdFBhc3N3b3Jk'; // Invalid prefix
      expect(() => parseBasicAuth(invalidAuthHeader)).toThrow(TypeError);
      expect(() => parseBasicAuth(invalidAuthHeader)).toThrow(
        'parseBasicAuth: Invalid Basic authentication scheme!',
      );
    });

    it('should throw an error if there is no colon in decoded credentials', () => {
      const invalidAuthHeader = `Basic ${Buffer.from('invalidHeader').toString('base64')}`;
      expect(() => parseBasicAuth(invalidAuthHeader)).toThrow(TypeError);
      expect(() => parseBasicAuth(invalidAuthHeader)).toThrow(
        'parseBasicAuth: Invalid Basic authentication scheme!',
      );
    });
  });

  describe('Integration Tests', () => {
    it('should correctly encode and decode the Basic Authorization header', () => {
      const username = 'integrateUser';
      const password = 'integratePass';
      const authHeader = createBasicAuth(username, password);
      const result = parseBasicAuth(authHeader);

      expect(result).toEqual({ username, password });
    });
  });
});
