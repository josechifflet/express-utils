import { describe, expect, it } from 'vitest';

import hmacDigest from './hmac-digest';

describe('hmacDigest', () => {
  const key = new Uint8Array([1, 2, 3, 4, 5]).buffer;
  const message = new Uint8Array([10, 20, 30, 40, 50]).buffer;

  it('should return a correct HMAC digest with SHA1', () => {
    const result = hmacDigest('SHA1', key, message);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(result).byteLength).toBe(20); // SHA1 produces 20 bytes
  });

  it('should return a correct HMAC digest with SHA256', () => {
    const result = hmacDigest('SHA256', key, message);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(result).byteLength).toBe(32); // SHA256 produces 32 bytes
  });

  it('should return a correct HMAC digest with SHA512', () => {
    const result = hmacDigest('SHA512', key, message);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(result).byteLength).toBe(64); // SHA512 produces 64 bytes
  });

  it('should produce consistent results for the same inputs', () => {
    const result1 = hmacDigest('SHA256', key, message);
    const result2 = hmacDigest('SHA256', key, message);
    expect(new Uint8Array(result1)).toEqual(new Uint8Array(result2));
  });

  it('should produce different results for different keys or messages', () => {
    const differentKey = new Uint8Array([6, 7, 8, 9, 10]).buffer;
    const differentMessage = new Uint8Array([15, 25, 35, 45, 55]).buffer;

    const result1 = hmacDigest('SHA256', key, message);
    const result2 = hmacDigest('SHA256', differentKey, message);
    const result3 = hmacDigest('SHA256', key, differentMessage);

    expect(new Uint8Array(result1)).not.toEqual(new Uint8Array(result2));
    expect(new Uint8Array(result1)).not.toEqual(new Uint8Array(result3));
  });
});
