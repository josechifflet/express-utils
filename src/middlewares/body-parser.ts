import type { NextFunction, Request, Response } from 'express';
import { json as parse } from 'express';

import { AppError } from '../error';

/**
 * Custom middleware for parsing JSON request bodies in Express.
 *
 * This middleware selectively parses JSON bodies only for requests where it is explicitly applied.
 * - Using this middleware only on specific routes helps optimize the API by avoiding unnecessary
 *   body parsing on endpoints that don't require JSON payloads, saving bandwidth and processing power.
 *
 * - Additionally, the middleware validates `Content-Type` and `Content-Length` headers to ensure
 *   compatibility with expected JSON payloads, enhancing security and reliability.
 *
 * @param req - Express.js request object containing incoming HTTP request data.
 * @param res - Express.js response object to send data back to the client.
 * @param next - Express.js `next` function to pass control to the next middleware.
 * @returns A customized instance of `express.json`, tailored for selective JSON parsing.
 */
const bodyParser = (req: Request, res: Response, next: NextFunction) => {
  const { ['content-type']: type, ['content-length']: length } = req.headers;

  // Check if the request `Content-Type` header is set to `application/json`.
  // This ensures that only JSON payloads are processed by this middleware, rejecting
  // requests with unsupported content types (e.g., text/plain or multipart/form-data).
  if (!type?.includes('application/json')) {
    // If the `Content-Type` is not JSON, respond with a 415 Unsupported Media Type error.
    next(
      new AppError(
        "This API only accepts requests with 'Content-Type' set to 'application/json'.",
        415,
      ),
    );
    return; // Stop further execution, as the request does not meet requirements.
  }

  // Validate the `Content-Length` header to prevent excessively large payloads.
  // - `Content-Length` specifies the size of the request body in bytes.
  // - By checking this header, the middleware can reject oversized payloads before fully parsing them,
  //   which improves efficiency and protects against denial-of-service attacks due to large payloads.
  // - Here, a threshold of 512 bytes is set, but this limit can be adjusted based on API requirements.
  if (length && Number.parseInt(length, 10) > 512) {
    // If `Content-Length` exceeds 512 bytes, respond with a 413 Payload Too Large error.
    next(
      new AppError('Request is too large! Please reduce your payload.', 413),
    );
    return; // Stop further execution, as the payload size is excessive.
  }

  // Invoke Express’s built-in `json` parser middleware, customized with:
  // - `type`: Set to 'application/json' to reinforce that only JSON payloads are parsed.
  // - `limit`: A hard limit of 512 bytes, ensuring the payload does not exceed the acceptable size.
  //
  // This middleware returns the parsed JSON data, allowing subsequent middleware or route handlers
  // to access the request body as a JavaScript object.
  return parse({ type: 'application/json', limit: 512 })(req, res, next);
};

export default bodyParser;
