import { Response } from 'express';
import { TimeGranularity, ApiError } from '../types';
import { DATE_REGEX, VALID_GRANULARITIES } from '../constants';

/**
 * Validate date string format (YYYY-MM-DD) and check if it represents a valid date.
 */
export function isValidDate(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Type guard to check if a value is a valid TimeGranularity.
 */
export function isValidGranularity(value: unknown): value is TimeGranularity {
  if (typeof value !== 'string') return false;
  const granularities: readonly string[] = VALID_GRANULARITIES;
  return granularities.includes(value);
}

/**
 * Parse string from query parameter, returning undefined if not a valid string.
 */
export function parseStringParam(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * Parse integer from query parameter, returning undefined if invalid.
 */
export function parseIntParam(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Send a standardized error response.
 */
export function sendError(res: Response, status: number, code: string, message: string): void {
  const error: ApiError = {
    success: false,
    error: { code, message },
  };
  res.status(status).json(error);
}

/**
 * Format a date string to ISO date format (YYYY-MM-DD).
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse numeric string fields from database rows (PostgreSQL returns some numbers as strings).
 */
export function parseNumericString(value: string): number {
  return parseInt(value, 10);
}

/**
 * Format a decimal number to 2 decimal places.
 */
export function formatDecimal(value: string | number): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return parseFloat(num.toFixed(2));
}
