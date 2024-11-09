import type { Request, Response } from 'express';

/**
 * Configuration object for sending standardized JSON API responses.
 * 
 * @template T - The type of data to include in the response.
 * @property req - The Express request object, not directly used but included for completeness.
 * @property res - The Express response object, used to send the response.
 * @property status - Status of the response; can be 'success', 'fail', or 'error'.
 * @property statusCode - HTTP status code to set in the response.
 * @property data - The payload data of type `T` to include in the response.
 * @property message - A message providing additional information about the response.
 * @property type - The category/type of the response, such as 'general', 'users', 'attendance', 'auth', or 'sessions'.
 */
interface ResponseOptions<T> {
  req: Request;
  res: Response;
  status: 'success' | 'fail' | 'error';
  statusCode: number;
  data: T;
  message: string;
  type: 'general' | 'users' | 'attendance' | 'auth' | 'sessions';
}

/**
 * Sends a JSON API-compliant response with standardized structure.
 * 
 * This function generates a consistent JSON response format, including status, message, data payload, 
 * and a response type category. The response conforms to JSON API standards, making it useful for 
 * structured, predictable API responses.
 *
 * @template T - The type of data to include in the response.
 * @param options - Object of type `ResponseOptions<T>` containing response details.
 * @returns Sends a JSON-formatted response through the Express response object.
 */
const sendResponse = <T>({
  res,
  status,
  statusCode,
  data,
  message,
  type,
}: ResponseOptions<T>) =>
  res.status(statusCode).json({
    status,
    message,
    data,
    type,
  });

export default sendResponse;
