import { describe, expect, it } from 'vitest';

import numberToBuf from './number-to-buf';

describe('numberToBuf', () => {
  it('should convert a small positive number to an 8-byte ArrayBuffer', () => {
    const num = 42;
    const buffer = numberToBuf(num);
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(buffer)).toEqual(
      new Uint8Array([0, 0, 0, 0, 0, 0, 0, 42]),
    );
  });

  it('should convert a large number to an 8-byte ArrayBuffer', () => {
    const num = 281474976710655; // Largest number that fits within 6 bytes
    const buffer = numberToBuf(num);
    expect(new Uint8Array(buffer)).toEqual(
      new Uint8Array([0, 0, 255, 255, 255, 255, 255, 255]),
    );
  });

  it('should convert zero to an 8-byte ArrayBuffer with all zeros', () => {
    const num = 0;
    const buffer = numberToBuf(num);
    expect(new Uint8Array(buffer)).toEqual(new Uint8Array(8));
  });

  it('should convert the maximum 8-byte integer to a full 8-byte ArrayBuffer', () => {
    const num = Number.MAX_SAFE_INTEGER;
    const buffer = numberToBuf(num);
    expect(new Uint8Array(buffer)).toEqual(
      new Uint8Array([0, 31, 255, 255, 255, 255, 255, 255]),
    );
  });

  it('should handle very large numbers by truncating to the lower 8 bytes', () => {
    const num = BigInt('0xFFFFFFFFFFFFFFFF') + 1n; // Overflow past 8 bytes
    const buffer = numberToBuf(Number(num));
    expect(new Uint8Array(buffer)).toEqual(
      new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]),
    ); // Overflow wraps to 0 in JavaScript
  });

  it('should be consistent with the same input value', () => {
    const num = 12345678;
    const buffer1 = numberToBuf(num);
    const buffer2 = numberToBuf(num);
    expect(new Uint8Array(buffer1)).toEqual(new Uint8Array(buffer2));
  });
});
