/**
 * Security utilities and configuration for the backend API.
 */
export const RATE_LIMIT_CONFIG = {
  ttl: 60_000, // 1 minute window
  limit: 60, // 60 requests per minute (per IP)
};
