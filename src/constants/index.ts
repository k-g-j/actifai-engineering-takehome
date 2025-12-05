import { TimeGranularity } from '../types';

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;

export const ERROR_CODES = {
  INVALID_GRANULARITY: 'INVALID_GRANULARITY',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_LIMIT: 'INVALID_LIMIT',
  INVALID_OFFSET: 'INVALID_OFFSET',
  MISSING_PARAMS: 'MISSING_PARAMS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export const ERROR_MESSAGES = {
  INVALID_DATE_FORMAT: 'must be in YYYY-MM-DD format',
  INVALID_DATE_RANGE: 'start_date must be before end_date',
  INVALID_LIMIT: 'limit must be between 1 and 100',
  INVALID_OFFSET: 'offset must be a non-negative integer',
  RATE_LIMIT: 'Too many requests, please try again later',
  NOT_FOUND: 'The requested endpoint does not exist',
  INTERNAL: 'An unexpected error occurred',
} as const;

export const VALID_GRANULARITIES: readonly TimeGranularity[] = [
  'day',
  'week',
  'month',
  'quarter',
  'year',
];

export const VALID_DATE_TRUNC_INTERVALS = new Set<TimeGranularity>(VALID_GRANULARITIES);

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000,
  MAX_REQUESTS: 100,
} as const;

export const DB_CONFIG = {
  MAX_CONNECTIONS: 20,
  IDLE_TIMEOUT_MS: 30000,
  CONNECTION_TIMEOUT_MS: 2000,
} as const;
