import {
  HTTP_STATUS,
  ERROR_CODES,
  VALID_GRANULARITIES,
  VALID_DATE_TRUNC_INTERVALS,
  DATE_REGEX,
  PAGINATION,
  RATE_LIMIT,
  DB_CONFIG,
} from '../constants';

describe('Constants', () => {
  describe('HTTP_STATUS', () => {
    it('defines correct HTTP status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
      expect(HTTP_STATUS.INTERNAL_ERROR).toBe(500);
    });
  });

  describe('ERROR_CODES', () => {
    it('defines expected error code strings', () => {
      expect(ERROR_CODES.INVALID_GRANULARITY).toBe('INVALID_GRANULARITY');
      expect(ERROR_CODES.INVALID_DATE).toBe('INVALID_DATE');
      expect(ERROR_CODES.INVALID_DATE_RANGE).toBe('INVALID_DATE_RANGE');
      expect(ERROR_CODES.INVALID_LIMIT).toBe('INVALID_LIMIT');
      expect(ERROR_CODES.INVALID_OFFSET).toBe('INVALID_OFFSET');
      expect(ERROR_CODES.MISSING_PARAMS).toBe('MISSING_PARAMS');
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
      expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('VALID_GRANULARITIES', () => {
    it('contains all valid granularity options', () => {
      expect(VALID_GRANULARITIES).toContain('day');
      expect(VALID_GRANULARITIES).toContain('week');
      expect(VALID_GRANULARITIES).toContain('month');
      expect(VALID_GRANULARITIES).toContain('quarter');
      expect(VALID_GRANULARITIES).toContain('year');
      expect(VALID_GRANULARITIES).toHaveLength(5);
    });

    it('is immutable (readonly array)', () => {
      expect(Array.isArray(VALID_GRANULARITIES)).toBe(true);
    });
  });

  describe('VALID_DATE_TRUNC_INTERVALS', () => {
    it('is a Set containing all valid granularity values', () => {
      expect(VALID_DATE_TRUNC_INTERVALS).toBeInstanceOf(Set);
      expect(VALID_DATE_TRUNC_INTERVALS.has('day')).toBe(true);
      expect(VALID_DATE_TRUNC_INTERVALS.has('week')).toBe(true);
      expect(VALID_DATE_TRUNC_INTERVALS.has('month')).toBe(true);
      expect(VALID_DATE_TRUNC_INTERVALS.has('quarter')).toBe(true);
      expect(VALID_DATE_TRUNC_INTERVALS.has('year')).toBe(true);
      expect(VALID_DATE_TRUNC_INTERVALS.size).toBe(5);
    });

    it('does not contain invalid values', () => {
      const intervals: Set<string> = new Set(VALID_DATE_TRUNC_INTERVALS);
      expect(intervals.has('hour')).toBe(false);
      expect(intervals.has('minute')).toBe(false);
    });
  });

  describe('DATE_REGEX', () => {
    it('matches valid YYYY-MM-DD format', () => {
      expect(DATE_REGEX.test('2021-01-01')).toBe(true);
      expect(DATE_REGEX.test('2023-12-31')).toBe(true);
      expect(DATE_REGEX.test('1999-06-15')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(DATE_REGEX.test('2021/01/01')).toBe(false);
      expect(DATE_REGEX.test('01-01-2021')).toBe(false);
      expect(DATE_REGEX.test('2021-1-1')).toBe(false);
      expect(DATE_REGEX.test('invalid')).toBe(false);
      expect(DATE_REGEX.test('')).toBe(false);
    });
  });

  describe('PAGINATION', () => {
    it('defines correct pagination limits', () => {
      expect(PAGINATION.DEFAULT_LIMIT).toBe(10);
      expect(PAGINATION.MAX_LIMIT).toBe(100);
      expect(PAGINATION.MIN_LIMIT).toBe(1);
    });
  });

  describe('RATE_LIMIT', () => {
    it('defines rate limiting configuration', () => {
      expect(RATE_LIMIT.WINDOW_MS).toBe(15 * 60 * 1000);
      expect(RATE_LIMIT.MAX_REQUESTS).toBe(100);
    });
  });

  describe('DB_CONFIG', () => {
    it('defines database configuration', () => {
      expect(DB_CONFIG.MAX_CONNECTIONS).toBe(20);
      expect(DB_CONFIG.IDLE_TIMEOUT_MS).toBe(30000);
      expect(DB_CONFIG.CONNECTION_TIMEOUT_MS).toBe(2000);
    });
  });
});
