import type { NextFunction, Request, Response } from 'express';

import { AppError } from '@/error';

/**
 * Middleware to enforce the presence of the `X-Requested-With` header to mitigate Cross-Site Request Forgery (CSRF).
 *
 * The `X-Requested-With` header is commonly used as a security measure to verify that requests originate from
 * an authorized client, typically by requiring AJAX requests from the same origin. By ensuring this header is
 * present, we reduce the risk of CSRF attacks, as cross-site requests (e.g., from malicious sites) usually lack
 * this header, particularly when targeting APIs from a browser context.
 *
 * This middleware assumes that requests lacking `X-Requested-With` are likely forged, so it denies such requests
 * with a `403 Forbidden` error, effectively blocking unauthorized access attempts.
 *
 * References for additional reading:
 * - Stack Overflow discussion on `X-Requested-With` header usage:
 *   {@link https://stackoverflow.com/questions/17478731/whats-the-point-of-the-x-requested-with-header}
 * - CSRF mitigation strategy overview:
 *   {@link https://markitzeroday.com/x-requested-with/cors/2017/06/29/csrf-mitigation-for-ajax-requests.html}
 * - OWASP CSRF Prevention Cheat Sheet:
 *   {@link https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#use-of-custom-request-headers}
 *
 * @returns Middleware function that verifies the presence of `X-Requested-With` header in the request.
 */
const xRequestedWith =
  () => (req: Request, _: Response, next: NextFunction) => {
    // Check for the presence of the `X-Requested-With` header, typically set by AJAX requests.
    // - `X-Requested-With` is used as a "custom" header, which will trigger a preflight request in CORS policy.
    // - Browsers do not allow cross-site requests with custom headers unless the server explicitly permits it.
    // - Absence of this header is often an indicator of a cross-site request, potentially a CSRF attack.
    if (!req.headers['x-requested-with']) {
      // If `X-Requested-With` header is missing, assume the request is unauthorized and likely forged.
      // - Return a 403 Forbidden response, blocking access to the API.
      // - `AppError` provides a structured error response, indicating that the request origin is not trusted.
      next(
        new AppError(
          'This API does not accept cross-site requests with browser agents unless from an authorized source.',
          403,
        ),
      );
      return; // Stop further processing, as this request does not meet security requirements.
    }

    // If the `X-Requested-With` header is present, proceed to the next middleware or route handler.
    // This allows only requests with a trusted origin (those that include the `X-Requested-With` header).
    next();
  };

export default xRequestedWith;
