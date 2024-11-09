import { timingSafeEqual } from 'node:crypto';

/**
 * Performs a timing-safe comparison of two strings to prevent timing attacks.
 * 
 * This function uses `timingSafeEqual` to securely compare two strings, ensuring that the comparison 
 * time remains constant, regardless of the input. This prevents timing attacks, which attempt to 
 * determine matching values based on comparison duration. If the strings are of different lengths, 
 * it returns `false` to avoid errors.
 * 
 * @param firstString - The first string to compare.
 * @param secondString - The second string to compare.
 * @returns `true` if the strings are equal, otherwise `false`.
 */
const timingSafeStringCompare = (firstString: string, secondString: string): boolean => {
  try {
    // Convert each string to a normalized buffer to ensure consistent encoding.
    // - `normalize()` ensures consistent Unicode representation, making comparisons reliable.
    return timingSafeEqual(
      Buffer.from(firstString.normalize()),
      Buffer.from(secondString.normalize())
    );
  } catch {
    // Return false if the buffers cannot be compared (e.g., different lengths).
    return false;
  }
};

export default timingSafeStringCompare;
