import { Router, Request, Response } from 'express';
import {
  getTimeSeries,
  getUserPerformance,
  getGroupPerformance,
  getLeaderboard,
  getSummaryStats,
  getPeriodComparison,
} from '../db/queries';
import { TimeGranularity, ApiResponse } from '../types';
import {
  HTTP_STATUS,
  ERROR_CODES,
  ERROR_MESSAGES,
  VALID_GRANULARITIES,
  PAGINATION,
} from '../constants';
import {
  isValidDate,
  isValidGranularity,
  parseStringParam,
  parseIntParam,
  sendError,
} from '../utils';

const router = Router();

/**
 * GET /api/sales/timeseries
 *
 * Returns time series sales data aggregated by the specified granularity.
 *
 * Query Parameters:
 *   - granularity: 'day' | 'week' | 'month' | 'quarter' | 'year' (default: 'month')
 *   - start_date: YYYY-MM-DD format (optional)
 *   - end_date: YYYY-MM-DD format (optional)
 *   - user_id: Filter by specific user (optional)
 *   - group_id: Filter by specific group (optional)
 */
router.get('/timeseries', async (req: Request, res: Response) => {
  try {
    const granularityParam = parseStringParam(req.query.granularity);
    const startDate = parseStringParam(req.query.start_date);
    const endDate = parseStringParam(req.query.end_date);
    const userId = parseIntParam(req.query.user_id);
    const groupId = parseIntParam(req.query.group_id);

    const granularity: TimeGranularity = isValidGranularity(granularityParam)
      ? granularityParam
      : 'month';

    if (granularityParam !== undefined && !isValidGranularity(granularityParam)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_GRANULARITY,
        `Invalid granularity. Must be one of: ${VALID_GRANULARITIES.join(', ')}`
      );
    }

    if (startDate && !isValidDate(startDate)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE,
        `start_date ${ERROR_MESSAGES.INVALID_DATE_FORMAT}`
      );
    }

    if (endDate && !isValidDate(endDate)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE,
        `end_date ${ERROR_MESSAGES.INVALID_DATE_FORMAT}`
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE_RANGE,
        ERROR_MESSAGES.INVALID_DATE_RANGE
      );
    }

    const data = await getTimeSeries(granularity, startDate, endDate, userId, groupId);

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      meta: {
        total: data.length,
        period: {
          start: startDate || (data.length > 0 ? data[0].period : ''),
          end: endDate || (data.length > 0 ? data[data.length - 1].period : ''),
        },
      },
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching time series data:', err);
    sendError(res, HTTP_STATUS.INTERNAL_ERROR, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch time series data');
  }
});

/**
 * GET /api/sales/users
 *
 * Returns performance metrics for users.
 *
 * Query Parameters:
 *   - start_date: YYYY-MM-DD format (optional)
 *   - end_date: YYYY-MM-DD format (optional)
 *   - user_id: Filter to specific user (optional)
 *   - limit: Maximum results to return (optional)
 *   - offset: Number of results to skip for pagination (optional)
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const startDate = parseStringParam(req.query.start_date);
    const endDate = parseStringParam(req.query.end_date);
    const userId = parseIntParam(req.query.user_id);
    const limit = parseIntParam(req.query.limit);
    const offset = parseIntParam(req.query.offset);

    if (startDate && !isValidDate(startDate)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE,
        `start_date ${ERROR_MESSAGES.INVALID_DATE_FORMAT}`
      );
    }

    if (endDate && !isValidDate(endDate)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE,
        `end_date ${ERROR_MESSAGES.INVALID_DATE_FORMAT}`
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE_RANGE,
        ERROR_MESSAGES.INVALID_DATE_RANGE
      );
    }

    if (limit !== undefined && (limit < PAGINATION.MIN_LIMIT || limit > PAGINATION.MAX_LIMIT)) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_LIMIT, ERROR_MESSAGES.INVALID_LIMIT);
    }

    if (offset !== undefined && offset < 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_OFFSET, ERROR_MESSAGES.INVALID_OFFSET);
    }

    const { data, total } = await getUserPerformance(startDate, endDate, userId, limit, offset);

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      meta: {
        total,
        limit,
        offset,
      },
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching user performance:', err);
    sendError(res, HTTP_STATUS.INTERNAL_ERROR, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch user performance data');
  }
});

/**
 * GET /api/sales/groups
 *
 * Returns performance metrics for groups.
 *
 * Query Parameters:
 *   - start_date: YYYY-MM-DD format (optional)
 *   - end_date: YYYY-MM-DD format (optional)
 *   - group_id: Filter to specific group (optional)
 */
router.get('/groups', async (req: Request, res: Response) => {
  try {
    const startDate = parseStringParam(req.query.start_date);
    const endDate = parseStringParam(req.query.end_date);
    const groupId = parseIntParam(req.query.group_id);

    if (startDate && !isValidDate(startDate)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE,
        `start_date ${ERROR_MESSAGES.INVALID_DATE_FORMAT}`
      );
    }

    if (endDate && !isValidDate(endDate)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE,
        `end_date ${ERROR_MESSAGES.INVALID_DATE_FORMAT}`
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE_RANGE,
        ERROR_MESSAGES.INVALID_DATE_RANGE
      );
    }

    const data = await getGroupPerformance(startDate, endDate, groupId);

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      meta: {
        total: data.length,
      },
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching group performance:', err);
    sendError(res, HTTP_STATUS.INTERNAL_ERROR, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch group performance data');
  }
});

/**
 * GET /api/sales/leaderboard
 *
 * Returns a ranked leaderboard of top performers.
 *
 * Query Parameters:
 *   - start_date: YYYY-MM-DD format (optional)
 *   - end_date: YYYY-MM-DD format (optional)
 *   - limit: Number of top performers to return (default: 10)
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const startDate = parseStringParam(req.query.start_date);
    const endDate = parseStringParam(req.query.end_date);
    const limit = parseIntParam(req.query.limit) ?? PAGINATION.DEFAULT_LIMIT;

    if (startDate && !isValidDate(startDate)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE,
        `start_date ${ERROR_MESSAGES.INVALID_DATE_FORMAT}`
      );
    }

    if (endDate && !isValidDate(endDate)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE,
        `end_date ${ERROR_MESSAGES.INVALID_DATE_FORMAT}`
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE_RANGE,
        ERROR_MESSAGES.INVALID_DATE_RANGE
      );
    }

    if (limit < PAGINATION.MIN_LIMIT || limit > PAGINATION.MAX_LIMIT) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_LIMIT, ERROR_MESSAGES.INVALID_LIMIT);
    }

    const data = await getLeaderboard(startDate, endDate, limit);

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
      meta: {
        total: data.length,
      },
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    sendError(res, HTTP_STATUS.INTERNAL_ERROR, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch leaderboard data');
  }
});

/**
 * GET /api/sales/summary
 *
 * Returns summary statistics for overall sales performance.
 *
 * Query Parameters:
 *   - start_date: YYYY-MM-DD format (optional)
 *   - end_date: YYYY-MM-DD format (optional)
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const startDate = parseStringParam(req.query.start_date);
    const endDate = parseStringParam(req.query.end_date);

    if (startDate && !isValidDate(startDate)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE,
        `start_date ${ERROR_MESSAGES.INVALID_DATE_FORMAT}`
      );
    }

    if (endDate && !isValidDate(endDate)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE,
        `end_date ${ERROR_MESSAGES.INVALID_DATE_FORMAT}`
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.INVALID_DATE_RANGE,
        ERROR_MESSAGES.INVALID_DATE_RANGE
      );
    }

    const data = await getSummaryStats(startDate, endDate);

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching summary stats:', err);
    sendError(res, HTTP_STATUS.INTERNAL_ERROR, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch summary statistics');
  }
});

/**
 * GET /api/sales/compare
 *
 * Compares performance between two time periods.
 *
 * Query Parameters (all required):
 *   - current_start: Start date of current period (YYYY-MM-DD)
 *   - current_end: End date of current period (YYYY-MM-DD)
 *   - previous_start: Start date of previous period (YYYY-MM-DD)
 *   - previous_end: End date of previous period (YYYY-MM-DD)
 */
router.get('/compare', async (req: Request, res: Response) => {
  try {
    const currentStart = parseStringParam(req.query.current_start);
    const currentEnd = parseStringParam(req.query.current_end);
    const previousStart = parseStringParam(req.query.previous_start);
    const previousEnd = parseStringParam(req.query.previous_end);

    if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.MISSING_PARAMS,
        'All date parameters are required: current_start, current_end, previous_start, previous_end'
      );
    }

    const dates: string[] = [currentStart, currentEnd, previousStart, previousEnd];
    for (const date of dates) {
      if (!isValidDate(date)) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.INVALID_DATE,
          `Invalid date format: ${date}. Use YYYY-MM-DD`
        );
      }
    }

    const data = await getPeriodComparison(currentStart, currentEnd, previousStart, previousEnd);

    const response: ApiResponse<typeof data> = {
      success: true,
      data,
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching period comparison:', err);
    sendError(res, HTTP_STATUS.INTERNAL_ERROR, ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch period comparison');
  }
});

export default router;
