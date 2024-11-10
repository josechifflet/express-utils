import type { Request } from 'express';
import { z } from 'zod';

/**
 * Safely extracts a string value from a specified header in an Express request.
 *
 * This function retrieves the value of a specified HTTP header and validates that it is a string.
 * If the header exists and contains a valid string, the value is returned. If the validation fails
 * (e.g., the header is missing or not a string), `undefined` is returned.
 *
 * This approach prevents potential issues with unexpected header values by ensuring type safety.
 *
 * @param request - The Express request object from which to extract the header value.
 * @param headerName - The name of the header to retrieve (e.g., "Authorization").
 * @returns The validated header value as a string, or `undefined` if the header is absent or invalid.
 */
const extractHeader = (
  request: Request,
  headerName: string,
): string | undefined => {
  // Retrieve the raw header value using the provided header name.
  // - Headers in Express are accessed via `req.headers`, where each key corresponds to a header name.
  const headerValue = request.headers[headerName];

  // Validate that the extracted header value is a string using Zod.
  // - `safeParse` performs type validation without throwing errors, returning a success status.
  const validatedHeader = z.string().safeParse(headerValue);
  if (validatedHeader.success) {
    // If validation succeeds, return the validated header value.
    return validatedHeader.data;
  }

  // If validation fails (header is missing or not a string), return `undefined`.
  return undefined;
};

export default extractHeader;
