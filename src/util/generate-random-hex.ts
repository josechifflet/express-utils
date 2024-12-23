import { randomBytes as generateBytes } from 'node:crypto';
import { promisify } from 'node:util';

/**
 * Generates a cryptographically secure random hex string, providing an alternative to NanoID.
 *
 * This function uses Node's `crypto.randomBytes` to create a buffer of random bytes, which is then
 * converted to a hexadecimal string. It is suitable for generating unique identifiers or tokens
 * where cryptographic security is required.
 *
 * @param byteSize - The number of bytes to generate. Defaults to 64 bytes.
 * @returns A promise that resolves to a hexadecimal string representing the random bytes.
 */
export const generateRandomHex = async (byteSize = 64): Promise<string> => {
  // Promisify `randomBytes` to enable async/await and generate the specified number of random bytes.
  const randomBuffer = await promisify(generateBytes)(byteSize);

  // Convert the buffer to a hexadecimal string and return it.
  return randomBuffer.toString('hex');
};

export default generateRandomHex;
