import request from 'supertest';
import express from 'express';
import salesRoutes from '../routes/sales';
import * as queries from '../db/queries';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

jest.mock('../db/queries');

const mockedQueries = jest.mocked(queries);

const app = express();
app.use(express.json());
app.use('/api/sales', salesRoutes);

describe('Sales API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/sales/timeseries', () => {
    const mockTimeSeriesData = [
      {
        period: '2021-01-01',
        total_revenue: 1000000,
        average_revenue: 25000,
        sale_count: 40,
        min_sale: 1000,
        max_sale: 50000,
      },
      {
        period: '2021-02-01',
        total_revenue: 1200000,
        average_revenue: 26000,
        sale_count: 46,
        min_sale: 1100,
        max_sale: 49000,
      },
    ];

    it('returns time series data with default granularity', async () => {
      mockedQueries.getTimeSeries.mockResolvedValue(mockTimeSeriesData);

      const response = await request(app).get('/api/sales/timeseries');

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTimeSeriesData);
      expect(response.body.meta.total).toBe(2);
      expect(mockedQueries.getTimeSeries).toHaveBeenCalledWith(
        'month',
        undefined,
        undefined,
        undefined,
        undefined
      );
    });

    it('accepts valid granularity parameter', async () => {
      mockedQueries.getTimeSeries.mockResolvedValue(mockTimeSeriesData);

      const response = await request(app).get('/api/sales/timeseries?granularity=week');

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockedQueries.getTimeSeries).toHaveBeenCalledWith(
        'week',
        undefined,
        undefined,
        undefined,
        undefined
      );
    });

    it('accepts date range parameters', async () => {
      mockedQueries.getTimeSeries.mockResolvedValue(mockTimeSeriesData);

      const response = await request(app).get(
        '/api/sales/timeseries?start_date=2021-01-01&end_date=2021-06-30'
      );

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockedQueries.getTimeSeries).toHaveBeenCalledWith(
        'month',
        '2021-01-01',
        '2021-06-30',
        undefined,
        undefined
      );
    });

    it('accepts user_id filter', async () => {
      mockedQueries.getTimeSeries.mockResolvedValue(mockTimeSeriesData);

      const response = await request(app).get('/api/sales/timeseries?user_id=5');

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockedQueries.getTimeSeries).toHaveBeenCalledWith(
        'month',
        undefined,
        undefined,
        5,
        undefined
      );
    });

    it('accepts group_id filter', async () => {
      mockedQueries.getTimeSeries.mockResolvedValue(mockTimeSeriesData);

      const response = await request(app).get('/api/sales/timeseries?group_id=2');

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockedQueries.getTimeSeries).toHaveBeenCalledWith(
        'month',
        undefined,
        undefined,
        undefined,
        2
      );
    });

    it('rejects invalid granularity', async () => {
      const response = await request(app).get('/api/sales/timeseries?granularity=invalid');

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.INVALID_GRANULARITY);
    });

    it('rejects invalid start_date format', async () => {
      const response = await request(app).get('/api/sales/timeseries?start_date=invalid');

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.INVALID_DATE);
    });

    it('rejects invalid end_date format', async () => {
      const response = await request(app).get('/api/sales/timeseries?end_date=2021/01/01');

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.error.code).toBe(ERROR_CODES.INVALID_DATE);
    });

    it('rejects start_date after end_date', async () => {
      const response = await request(app).get(
        '/api/sales/timeseries?start_date=2021-06-01&end_date=2021-01-01'
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.error.code).toBe(ERROR_CODES.INVALID_DATE_RANGE);
    });
  });

  describe('GET /api/sales/users', () => {
    const mockUserData = {
      data: [
        {
          user_id: 1,
          user_name: 'Alice',
          role: 'Agent',
          total_revenue: 500000,
          average_revenue: 25000,
          sale_count: 20,
          min_sale: 5000,
          max_sale: 45000,
        },
      ],
      total: 20,
    };

    it('returns user performance data', async () => {
      mockedQueries.getUserPerformance.mockResolvedValue(mockUserData);

      const response = await request(app).get('/api/sales/users');

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUserData.data);
      expect(response.body.meta.total).toBe(20);
    });

    it('accepts pagination parameters', async () => {
      mockedQueries.getUserPerformance.mockResolvedValue(mockUserData);

      const response = await request(app).get('/api/sales/users?limit=10&offset=5');

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockedQueries.getUserPerformance).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        10,
        5
      );
    });

    it('accepts user_id filter', async () => {
      mockedQueries.getUserPerformance.mockResolvedValue(mockUserData);

      const response = await request(app).get('/api/sales/users?user_id=3');

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockedQueries.getUserPerformance).toHaveBeenCalledWith(
        undefined,
        undefined,
        3,
        undefined,
        undefined
      );
    });

    it('rejects limit below minimum', async () => {
      const response = await request(app).get('/api/sales/users?limit=0');

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.error.code).toBe(ERROR_CODES.INVALID_LIMIT);
    });

    it('rejects limit above maximum', async () => {
      const response = await request(app).get('/api/sales/users?limit=101');

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.error.code).toBe(ERROR_CODES.INVALID_LIMIT);
    });

    it('rejects negative offset', async () => {
      const response = await request(app).get('/api/sales/users?offset=-1');

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.error.code).toBe(ERROR_CODES.INVALID_OFFSET);
    });
  });

  describe('GET /api/sales/groups', () => {
    const mockGroupData = [
      {
        group_id: 1,
        group_name: 'Northeast Sales Team',
        total_revenue: 5000000,
        average_revenue: 25000,
        sale_count: 200,
        user_count: 10,
        min_sale: 1000,
        max_sale: 50000,
      },
    ];

    it('returns group performance data', async () => {
      mockedQueries.getGroupPerformance.mockResolvedValue(mockGroupData);

      const response = await request(app).get('/api/sales/groups');

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockGroupData);
      expect(response.body.meta.total).toBe(1);
    });

    it('accepts group_id filter', async () => {
      mockedQueries.getGroupPerformance.mockResolvedValue(mockGroupData);

      const response = await request(app).get('/api/sales/groups?group_id=1');

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockedQueries.getGroupPerformance).toHaveBeenCalledWith(undefined, undefined, 1);
    });

    it('accepts date range parameters', async () => {
      mockedQueries.getGroupPerformance.mockResolvedValue(mockGroupData);

      const response = await request(app).get(
        '/api/sales/groups?start_date=2021-01-01&end_date=2021-12-31'
      );

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockedQueries.getGroupPerformance).toHaveBeenCalledWith(
        '2021-01-01',
        '2021-12-31',
        undefined
      );
    });
  });

  describe('GET /api/sales/leaderboard', () => {
    const mockLeaderboardData = [
      {
        rank: 1,
        user_id: 5,
        user_name: 'Top Seller',
        role: 'Agent',
        total_revenue: 700000,
        sale_count: 28,
      },
      {
        rank: 2,
        user_id: 3,
        user_name: 'Second Best',
        role: 'Agent',
        total_revenue: 650000,
        sale_count: 26,
      },
    ];

    it('returns leaderboard with default limit', async () => {
      mockedQueries.getLeaderboard.mockResolvedValue(mockLeaderboardData);

      const response = await request(app).get('/api/sales/leaderboard');

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockLeaderboardData);
      expect(mockedQueries.getLeaderboard).toHaveBeenCalledWith(undefined, undefined, 10);
    });

    it('accepts custom limit', async () => {
      mockedQueries.getLeaderboard.mockResolvedValue(mockLeaderboardData);

      const response = await request(app).get('/api/sales/leaderboard?limit=5');

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockedQueries.getLeaderboard).toHaveBeenCalledWith(undefined, undefined, 5);
    });

    it('rejects invalid limit', async () => {
      const response = await request(app).get('/api/sales/leaderboard?limit=150');

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.error.code).toBe(ERROR_CODES.INVALID_LIMIT);
    });
  });

  describe('GET /api/sales/summary', () => {
    const mockSummaryData = {
      total_revenue: 126000000,
      total_sales: 5000,
      average_sale: 25200,
      min_sale: 1000,
      max_sale: 50000,
      unique_sellers: 20,
      date_range: {
        start: '2021-01-01',
        end: '2021-12-31',
      },
    };

    it('returns summary statistics', async () => {
      mockedQueries.getSummaryStats.mockResolvedValue(mockSummaryData);

      const response = await request(app).get('/api/sales/summary');

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSummaryData);
    });

    it('accepts date range filters', async () => {
      mockedQueries.getSummaryStats.mockResolvedValue(mockSummaryData);

      const response = await request(app).get(
        '/api/sales/summary?start_date=2021-01-01&end_date=2021-06-30'
      );

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(mockedQueries.getSummaryStats).toHaveBeenCalledWith('2021-01-01', '2021-06-30');
    });
  });

  describe('GET /api/sales/compare', () => {
    const mockComparisonData = {
      current: {
        period: '2021-07-01 to 2021-12-31',
        total_revenue: 62000000,
        sale_count: 2500,
        average_revenue: 24800,
      },
      previous: {
        period: '2021-01-01 to 2021-06-30',
        total_revenue: 64000000,
        sale_count: 2500,
        average_revenue: 25600,
      },
      change: {
        revenue_change: -2000000,
        revenue_change_pct: -3.13,
        count_change: 0,
        count_change_pct: 0,
      },
    };

    it('returns period comparison data', async () => {
      mockedQueries.getPeriodComparison.mockResolvedValue(mockComparisonData);

      const response = await request(app).get(
        '/api/sales/compare?current_start=2021-07-01&current_end=2021-12-31&previous_start=2021-01-01&previous_end=2021-06-30'
      );

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockComparisonData);
    });

    it('requires all date parameters', async () => {
      const response = await request(app).get(
        '/api/sales/compare?current_start=2021-07-01&current_end=2021-12-31'
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.error.code).toBe(ERROR_CODES.MISSING_PARAMS);
    });

    it('rejects invalid date format in parameters', async () => {
      const response = await request(app).get(
        '/api/sales/compare?current_start=invalid&current_end=2021-12-31&previous_start=2021-01-01&previous_end=2021-06-30'
      );

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(response.body.error.code).toBe(ERROR_CODES.INVALID_DATE);
    });
  });

  describe('Error handling', () => {
    it('handles database errors gracefully', async () => {
      mockedQueries.getTimeSeries.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/sales/timeseries');

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_ERROR);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    });
  });
});
