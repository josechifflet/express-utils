import { describe, expect, it } from 'vitest';

import { b32FromBuf, b32ToBuf } from './base32';

describe('Base32 Encoding and Decoding Functions', () => {
  // Corrected Base32 encoded string for "Hello, World!" and its ArrayBuffer
  const sampleString = 'JBSWY3DPFQQFO33SNRSCC==='; // Expected Base32 string for "Hello, World!"
  const sampleArrayBuffer = new Uint8Array([
    72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33,
  ]).buffer;

  describe('b32ToBuf', () => {
    it('should decode a valid Base32 string to an ArrayBuffer', () => {
      const decodedBuffer = b32ToBuf(sampleString);
      expect(decodedBuffer).toBeInstanceOf(ArrayBuffer);
      expect(new Uint8Array(decodedBuffer)).toEqual(
        new Uint8Array(sampleArrayBuffer),
      );
    });

    it('should handle Base32 strings without padding', () => {
      const noPaddingString = sampleString.replace(/=+$/, ''); // Remove padding
      const decodedBuffer = b32ToBuf(noPaddingString);
      expect(new Uint8Array(decodedBuffer)).toEqual(
        new Uint8Array(sampleArrayBuffer),
      );
    });

    it('should throw an error for an invalid Base32 string', () => {
      expect(() => b32ToBuf('INVALID_STRING')).toThrow(TypeError);
      expect(() => b32ToBuf('INVALID_STRING')).toThrow(
        'b32ToBuf: Invalid character found',
      );
    });
  });

  describe('b32FromBuf', () => {
    it('should encode an ArrayBuffer to a Base32 string with padding', () => {
      const encodedString = b32FromBuf(sampleArrayBuffer);
      expect(encodedString).toBe(sampleString);
    });

    it('should handle an empty ArrayBuffer', () => {
      const emptyBuffer = new ArrayBuffer(0);
      const encodedString = b32FromBuf(emptyBuffer);
      expect(encodedString).toBe('');
    });

    it('should maintain correct Base32 encoding for various buffer lengths', () => {
      const smallBuffer = new Uint8Array([1, 2, 3]).buffer;
      const smallBufferEncoded = b32FromBuf(smallBuffer);
      expect(smallBufferEncoded).toMatch(/^[A-Z2-7]+=*$/); // Valid Base32 characters with padding
    });
  });

  describe('Round-trip Encoding and Decoding', () => {
    it('should decode a Base32-encoded string back to the original ArrayBuffer', () => {
      const encodedString = b32FromBuf(sampleArrayBuffer);
      const decodedBuffer = b32ToBuf(encodedString);
      expect(new Uint8Array(decodedBuffer)).toEqual(
        new Uint8Array(sampleArrayBuffer),
      );
    });

    it('should encode an ArrayBuffer and decode back to the original Base32 string', () => {
      const decodedBuffer = b32ToBuf(sampleString);
      const encodedString = b32FromBuf(decodedBuffer);
      expect(encodedString).toBe(sampleString);
    });
  });
});
