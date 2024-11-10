import * as OTPAuth from 'otpauth';

import timingSafeStringCompare from '@/util/timing-safe-string-compare';

import { b32FromBuf, b32ToBuf } from './util/base32';
import hmacDigest from './util/hmac-digest';
import numberToBuf from './util/number-to-buf';
import pad from './util/pad';

/**
 * Collection of parameters for generating and validating a TOTP.
 */
export type OTPParams = {
  issuer: string; // Issuer of the OTP (e.g., the app name)
  label: string; // Label to identify the account associated with the OTP
  algorithm: 'SHA1' | 'SHA256' | 'SHA512'; // Hashing algorithm
  digits: number; // Number of digits in the OTP
  period: number; // Time period (in seconds) before the OTP changes
  secret: string; // Shared secret key in base32 format
};

/**
 * Generates a default TOTP compatible with Authenticator apps.
 *
 * @param issuer - The issuer (application name) for the OTP.
 * @param label - Account label to identify who the OTP is for.
 * @param secret - The shared secret key.
 * @returns An object containing the TOTP token and Authenticator URI.
 */
export const generateDefaultTOTP = (
  issuer: string,
  label: string,
  secret: string,
) => {
  const otpSecret = OTPAuth.Secret.fromBase32(b32FromBuf(Buffer.from(secret)));
  const totp = new OTPAuth.TOTP({
    issuer,
    label,
    algorithm: 'SHA1', // Default algorithm
    digits: 6, // Standard 6-digit OTP
    period: 30, // 30-second time window
    secret: otpSecret,
  });

  return { token: totp.generate(), uri: totp.toString() };
};

/**
 * Generates a TOTP with custom parameters according to RFC 6238.
 *
 * @param params - Object containing OTP parameters.
 * @returns An object containing the TOTP token and Authenticator URI.
 */
export const generateTOTP = ({
  issuer,
  label,
  algorithm,
  digits,
  period,
  secret,
}: OTPParams) => {
  const otpSecret = OTPAuth.Secret.fromBase32(b32FromBuf(Buffer.from(secret)));
  const totp = new OTPAuth.TOTP({
    issuer,
    label,
    algorithm,
    digits,
    period,
    secret: otpSecret,
  });

  return { token: totp.generate(), uri: totp.toString() };
};

/**
 * Validates a TOTP using default parameters.
 *
 * @param issuer - The OTP issuer.
 * @param token - OTP token to validate.
 * @param secret - Shared secret key for validation.
 * @returns Boolean indicating whether the OTP is valid.
 */
export const validateDefaultTOTP = (
  issuer: string,
  token: string,
  secret: string,
) => {
  const otpSecret = OTPAuth.Secret.fromBase32(b32FromBuf(Buffer.from(secret)));
  const totp = new OTPAuth.TOTP({
    issuer,
    algorithm: 'SHA1', // Default algorithm
    digits: 6,
    period: 30,
    secret: otpSecret,
  });

  const delta = totp.validate({ token, window: 2 }); // Allows time drift of up to 2 periods
  return delta !== null && delta >= -2;
};

/**
 * Validates a custom TOTP according to RFC 6238.
 *
 * @param token - OTP token to validate.
 * @param params - Object containing OTP parameters.
 * @returns Boolean indicating whether the OTP is valid.
 */
export const validateTOTP = (
  token: string,
  { issuer, label, algorithm, digits, period, secret }: OTPParams,
) => {
  const otpSecret = OTPAuth.Secret.fromBase32(b32FromBuf(Buffer.from(secret)));
  const totp = new OTPAuth.TOTP({
    issuer,
    label,
    algorithm,
    digits,
    period,
    secret: otpSecret,
  });

  const delta = totp.validate({ token, window: 2 });
  return delta !== null && delta >= -2;
};

/**
 * Generates a TOTP token using a custom algorithm (without external libraries).
 *
 * @param counter - Counter value, usually `Date.now() / 1000 / period`.
 * @param params - OTP parameters.
 * @returns An object containing the OTP token and Authenticator URI.
 */
export const generateOwnOTP = (
  counter: number,
  { issuer, label, algorithm, digits, period, secret }: OTPParams,
) => {
  const b32Secret = b32ToBuf(b32FromBuf(Buffer.from(secret)));
  const epoch = numberToBuf(counter);

  // Perform HMAC digest and truncate to get OTP
  const digest = new Uint8Array(hmacDigest(algorithm, b32Secret, epoch));
  const offset = digest[digest.byteLength - 1] & 15;
  const otp =
    (((digest[offset] & 127) << 24) |
      ((digest[offset + 1] & 255) << 16) |
      ((digest[offset + 2] & 255) << 8) |
      (digest[offset + 3] & 255)) %
    10 ** digits;

  const token = pad(otp, digits); // Pad OTP with zeroes if necessary
  const uri = `otpauth://totp/${issuer}:${label}?issuer=${issuer}&secret=${secret}&algorithm=${algorithm}&digits=${digits}&period=${period}`;

  return { token, uri: encodeURI(uri) };
};

/**
 * Verifies a TOTP token generated with a custom algorithm.
 *
 * @param otp - OTP token to validate.
 * @param window - Validity window in time steps.
 * @param params - OTP parameters.
 * @returns Boolean indicating whether the OTP is valid.
 */
export const verifyOwnTOTP = (
  otp: string,
  window: number,
  { issuer, label, algorithm, digits, period, secret }: OTPParams,
) => {
  if (otp.length !== digits) return false;

  const counter = Math.floor(Date.now() / 1000 / period);

  // Verify OTP within the specified time window
  for (let i = counter - window; i <= counter + window; i++) {
    const generatedOTP = generateOwnOTP(i, {
      issuer,
      label,
      algorithm,
      digits,
      period,
      secret,
    }).token;

    if (timingSafeStringCompare(otp, generatedOTP)) {
      return true;
    }
  }

  return false;
};
