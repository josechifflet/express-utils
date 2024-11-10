import argon2 from 'argon2';

/**
 * Asynchronously hashes a password using the Argon2 algorithm.
 *
 * This function uses the Argon2 algorithm, which is highly secure and recommended for password hashing.
 * Argon2 is resistant to brute-force and side-channel attacks due to its adjustable memory and time complexity.
 * The hashing is performed with Argon2’s default parameters:
 * - 3 iterations (time cost): Number of passes over the memory to increase computational difficulty.
 * - 4096 KiB (memory cost): Amount of memory required for hashing, making brute-force attacks expensive.
 * - 1 parallelism: Number of threads used in parallel, typically left at 1 for single-threaded environments.
 * - 32-byte hash length: Length of the resulting hash.
 * - 16-byte salt length: Length of the salt added to the password to ensure unique hashes.
 * - Argon2i version 0x13 (type Argon2i): Version and type of Argon2 used for hashing.
 *
 * @param plainPassword - The user's plaintext password to hash.
 * @returns A promise that resolves to the Argon2-hashed password as a string.
 */
export const hashPassword = (plainPassword: string): Promise<string> =>
  // Normalize the password string to ensure consistent encoding, then hash it.
  argon2.hash(plainPassword.normalize());

/**
 * Verifies a plaintext password against a previously hashed password.
 *
 * This function checks if a provided plaintext password matches a stored Argon2 hash.
 * It is commonly used in authentication to verify if a user-provided password is correct.
 *
 * @param hashedPassword - The stored Argon2 hash of the password.
 * @param plainPassword - The plaintext password provided by the user for verification.
 * @returns A promise that resolves to `true` if the password matches the hash, otherwise `false`.
 */
export const verifyPassword = (
  hashedPassword: string,
  plainPassword: string,
): Promise<boolean> =>
  // Normalize the plaintext password to ensure consistent encoding, then verify it against the hash.
  argon2.verify(hashedPassword, plainPassword.normalize());
