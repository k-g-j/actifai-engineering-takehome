import {
  isValidDate,
  isValidGranularity,
  parseStringParam,
  parseIntParam,
  formatDateString,
  parseNumericString,
  formatDecimal,
} from '../utils';

describe('Utils', () => {
  describe('isValidDate', () => {
    it('accepts valid YYYY-MM-DD format', () => {
      expect(isValidDate('2021-01-01')).toBe(true);
      expect(isValidDate('2021-12-31')).toBe(true);
      expect(isValidDate('2000-06-15')).toBe(true);
    });

    it('rejects invalid date formats', () => {
      expect(isValidDate('2021/01/01')).toBe(false);
      expect(isValidDate('01-01-2021')).toBe(false);
      expect(isValidDate('2021-1-1')).toBe(false);
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });

    it('rejects obviously invalid dates', () => {
      expect(isValidDate('2021-13-01')).toBe(false);
      expect(isValidDate('2021-00-01')).toBe(false);
    });
  });

  describe('isValidGranularity', () => {
    it('accepts valid granularity values', () => {
      expect(isValidGranularity('day')).toBe(true);
      expect(isValidGranularity('week')).toBe(true);
      expect(isValidGranularity('month')).toBe(true);
      expect(isValidGranularity('quarter')).toBe(true);
      expect(isValidGranularity('year')).toBe(true);
    });

    it('rejects invalid granularity values', () => {
      expect(isValidGranularity('invalid')).toBe(false);
      expect(isValidGranularity('hourly')).toBe(false);
      expect(isValidGranularity('')).toBe(false);
      expect(isValidGranularity(null)).toBe(false);
      expect(isValidGranularity(undefined)).toBe(false);
      expect(isValidGranularity(123)).toBe(false);
    });
  });

  describe('parseStringParam', () => {
    it('returns string for valid non-empty strings', () => {
      expect(parseStringParam('test')).toBe('test');
      expect(parseStringParam('hello world')).toBe('hello world');
    });

    it('returns undefined for empty strings', () => {
      expect(parseStringParam('')).toBeUndefined();
    });

    it('returns undefined for non-string values', () => {
      expect(parseStringParam(123)).toBeUndefined();
      expect(parseStringParam(null)).toBeUndefined();
      expect(parseStringParam(undefined)).toBeUndefined();
      expect(parseStringParam({})).toBeUndefined();
    });
  });

  describe('parseIntParam', () => {
    it('parses valid integer strings', () => {
      expect(parseIntParam('10')).toBe(10);
      expect(parseIntParam('0')).toBe(0);
      expect(parseIntParam('-5')).toBe(-5);
      expect(parseIntParam('100')).toBe(100);
    });

    it('returns undefined for invalid values', () => {
      expect(parseIntParam('abc')).toBeUndefined();
      expect(parseIntParam('')).toBeUndefined();
      expect(parseIntParam(123)).toBeUndefined();
      expect(parseIntParam(null)).toBeUndefined();
    });

    it('truncates decimal strings to integers', () => {
      expect(parseIntParam('10.5')).toBe(10);
      expect(parseIntParam('3.9')).toBe(3);
    });
  });

  describe('formatDateString', () => {
    it('formats Date to YYYY-MM-DD string', () => {
      expect(formatDateString(new Date('2021-01-15'))).toBe('2021-01-15');
      expect(formatDateString(new Date('2021-12-31'))).toBe('2021-12-31');
    });
  });

  describe('parseNumericString', () => {
    it('parses string numbers to integers', () => {
      expect(parseNumericString('100')).toBe(100);
      expect(parseNumericString('0')).toBe(0);
      expect(parseNumericString('999999')).toBe(999999);
    });
  });

  describe('formatDecimal', () => {
    it('formats numbers to 2 decimal places', () => {
      expect(formatDecimal(10.5555)).toBe(10.56);
      expect(formatDecimal('25.999')).toBe(26);
      expect(formatDecimal(100)).toBe(100);
    });

    it('handles string input', () => {
      expect(formatDecimal('123.456')).toBe(123.46);
    });
  });
});
