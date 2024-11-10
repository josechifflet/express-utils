import DeviceDetector from 'device-detector-js';
import type { Request } from 'express';
import { getClientIp } from 'request-ip';

/**
 * Parses and returns information about the user's device and IP address from the Express request object.
 *
 * This function extracts the user agent string from the request headers, utilizes `DeviceDetector`
 * to identify the client application (e.g., browser) and operating system, and retrieves the user's
 * IP address. This information is valuable for logging, analytics, and security purposes.
 *
 * @param request - Express request object containing client information.
 * @returns An object containing the user's device information and IP address.
 */
const getDeviceID = (request: Request) => {
  // Retrieve the user agent string from the request headers.
  // - If the `user-agent` header is not available, default to an empty string.
  const userAgent = request.headers['user-agent'] || '';

  // Instantiate DeviceDetector and parse the user agent string to detect client and OS details.
  // - `client` represents the application making the request (e.g., browser and version).
  // - `os` represents the operating system of the device.
  const detectedDevice = new DeviceDetector().parse(userAgent);

  // Format the device information to display the client name, version, and operating system.
  // - The format used is "<client name> <client version> on <operating system name>".
  const deviceDescription = `${detectedDevice.client?.name || 'Unknown Client'} ${detectedDevice.client?.version || ''} on ${detectedDevice.os?.name || 'Unknown OS'}`;

  // Retrieve the client's IP address from the request, defaulting to "Unknown IP!" if unavailable.
  // - `getClientIp` extracts the IP address, considering potential sources like headers or connection details.
  const clientIp = getClientIp(request) || 'Unknown IP!';

  return {
    device: deviceDescription,
    ip: clientIp,
  };
};

export default getDeviceID;
