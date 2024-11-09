import type { Request } from 'express';

/**
 * Determines if the current connection is secure (HTTPS).
 * 
 * This function checks if a request was made over a secure HTTPS connection. It verifies the
 * `req.secure` property, which is set by Express if the connection uses HTTPS. Additionally,
 * it checks the `x-forwarded-proto` header, commonly set by reverse proxies (e.g., load balancers)
 * to indicate the original protocol of the request. This double-check helps in environments where
 * traffic is routed through proxies.
 *
 * @param request - The Express request object representing the incoming HTTP request.
 * @returns `true` if the connection is secure (HTTPS), otherwise `false`.
 */
const isHTTPS = (request: Request): boolean => {
  // Check if the `req.secure` property is true, indicating an HTTPS connection in Express.
  // - This property is set by Express if the request was made over HTTPS.
  if (request.secure) {
    return true;
  }

  // Additional check for the `x-forwarded-proto` header, which some proxies set to 'https' 
  // when forwarding HTTPS requests. This ensures the function can identify HTTPS even behind a proxy.
  if (request.headers['x-forwarded-proto'] === 'https') {
    return true;
  }

  // If neither check passes, the connection is assumed to be insecure (HTTP).
  return false;
};

export default isHTTPS;
