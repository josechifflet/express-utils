import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware to prevent unnecessary `404 Not Found` errors when clients request the `favicon.ico` file.
 * 
 * Many browsers and user agents automatically request a `favicon.ico` file from the server to display as 
 * an icon in browser tabs or bookmarks. In APIs, where a favicon is usually not provided, these requests
 * often result in `404 Not Found` errors. This middleware intercepts requests for `favicon.ico` and 
 * responds with a `204 No Content` status, which signals that the request was handled but no content 
 * is available. This approach helps reduce server logs and prevents unnecessary error responses for these 
 * automatic requests.
 *
 * - `204 No Content` is an ideal response because it indicates successful handling without data.
 * - This middleware should be applied globally to cover all routes, as favicon requests can occur on any endpoint.
 *
 * @returns A middleware function to intercept `favicon.ico` requests and respond with a `204` status.
 */
const favicon = () => (req: Request, res: Response, next: NextFunction) => {
  // Check if the request URL includes 'favicon.ico'.
  // - Browsers request this file by default, and the API does not serve a favicon, so these requests should be ignored.
  // - `req.originalUrl` captures the original path requested by the client, allowing for easy identification of favicon requests.
  if (req.originalUrl.includes('favicon.ico')) {
    // Respond with a 204 No Content status to indicate that the request is acknowledged but there is no data to serve.
    // - The `end()` method terminates the response process without sending any content, fulfilling the request.
    res.status(204).end();
    return; // Exit early to prevent further middleware processing for this request.
  }

  // If the request is not for `favicon.ico`, proceed to the next middleware or route handler.
  next();
};

export default favicon;
