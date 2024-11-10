/**
 * Generates a Basic Authorization header string as defined by RFC 7617.
 *
 * Basic Authorization is a simple HTTP authentication scheme that transmits credentials
 * in a "username:password" format, encoded in Base64. The resulting string is used in HTTP
 * headers to provide a client’s identity and password to a server. This function creates the
 * Basic Authorization header string, though this logic will typically be performed on the
 * client-side (frontend) to prevent sensitive information exposure.
 *
 * {@link https://datatracker.ietf.org/doc/html/rfc7617} for detailed RFC specifications.
 *
 * @param username - The user’s username or identifier that will be used as the credential for access.
 * @param password - The user’s password associated with the username, used as the second part of the credentials.
 * @returns A properly formatted Basic Authorization string that can be included in HTTP headers.
 */
export const createBasicAuth = (username: string, password: string) => {
  // Create the "username:password" string that represents the basic credential format.
  // This string will later be Base64-encoded to meet Basic Auth specifications.
  const credentials = `${username}:${password}`;

  // Convert the credentials to a Base64-encoded string.
  // Base64 encoding ensures that any special characters in the username or password
  // are encoded in a manner compatible with HTTP headers, which require ASCII characters.
  const encoded = Buffer.from(credentials).toString('base64');

  // Prefix the encoded credentials with "Basic " to form the Authorization header format.
  // This is critical for the server to recognize that the encoded string is using Basic Auth.
  return `Basic ${encoded}`;
};

/**
 * Parses and decodes a Basic Authorization header string based on RFC 7617.
 *
 * This function takes a Basic Authorization string (usually from an HTTP request header)
 * and decodes it to extract the original username and password. The format expected is:
 * "Basic <Base64-encoded credentials>". After decoding, the function returns an object
 * containing the username and password in plaintext. Note that in Basic Auth, only the
 * password may contain colons (":"), while the username cannot.
 *
 * {@link https://datatracker.ietf.org/doc/html/rfc7617} for RFC details.
 *
 * @param auth - The Authorization header string in "Basic <Base64-encoded credentials>" format.
 * @returns An object with the decoded username and password, ready for further processing.
 * @throws TypeError if the authorization scheme is invalid (e.g., missing "Basic " prefix).
 */
export const parseBasicAuth = (auth: string) => {
  // Split the authorization string by "Basic ", expecting the format "Basic <Base64-encoded credentials>".
  // The `credentials` variable should only contain the Base64-encoded portion of the header.
  const [, credentials] = auth.split('Basic ');

  // Validate that the provided authorization string follows the expected "Basic <credentials>" format.
  // If `credentials` is undefined, the function throws an error to indicate an invalid scheme.
  if (!credentials) {
    throw new TypeError('parseBasicAuth: Invalid Basic authentication scheme!');
  }

  // Decode the Base64-encoded credentials to retrieve the original "username:password" string.
  // This step is crucial to reverse the encoding applied during the authorization creation.
  const decoded = Buffer.from(credentials, 'base64').toString('utf-8');

  // Locate the first occurrence of ":" in the decoded string to separate the username and password.
  // This position marks the boundary between the username and the password.
  const separator = decoded.indexOf(':');

  // Check if the colon separator exists in the decoded string.
  // An absence of the colon indicates an invalid format, as Basic Auth requires the "username:password" structure.
  if (separator === -1) {
    throw new TypeError('parseBasicAuth: Invalid Basic authentication scheme!');
  }

  // Extract the username by slicing the decoded string from the start to the colon’s position.
  // This portion of the string represents the username as per Basic Auth’s structure.
  const username = decoded.slice(0, separator);

  // Extract the password by slicing the decoded string from after the colon to the end of the string.
  // This portion represents the password, which can include colons (":"), unlike the username.
  const password = decoded.slice(separator + 1);

  // Return an object containing the username and password for further authentication or validation processes.
  return { username, password };
};
