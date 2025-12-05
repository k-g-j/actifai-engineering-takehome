import { query } from './index';
import {
  TimeSeriesDataPoint,
  UserPerformance,
  GroupPerformance,
  LeaderboardEntry,
  TimeGranularity,
} from '../types';
import { VALID_DATE_TRUNC_INTERVALS } from '../constants';
import { formatDateString, parseNumericString, formatDecimal } from '../utils';

interface TimeSeriesRow {
  period: Date;
  total_revenue: string;
  average_revenue: string;
  sale_count: string;
  min_sale: number;
  max_sale: number;
}

interface UserPerformanceRow {
  user_id: number;
  user_name: string;
  role: string;
  total_revenue: string;
  average_revenue: string;
  sale_count: string;
  min_sale: number;
  max_sale: number;
}

interface GroupPerformanceRow {
  group_id: number;
  group_name: string;
  total_revenue: string;
  average_revenue: string;
  sale_count: string;
  user_count: string;
  min_sale: number;
  max_sale: number;
}

interface LeaderboardRow {
  user_id: number;
  user_name: string;
  role: string;
  total_revenue: string;
  sale_count: string;
}

interface SummaryStatsRow {
  total_revenue: string;
  total_sales: string;
  average_sale: string;
  min_sale: number;
  max_sale: number;
  unique_sellers: string;
  first_sale_date: Date;
  last_sale_date: Date;
}

interface SummaryStats {
  total_revenue: number;
  total_sales: number;
  average_sale: number;
  min_sale: number;
  max_sale: number;
  unique_sellers: number;
  date_range: {
    start: string;
    end: string;
  };
}

interface ComparisonRow {
  period_label: string;
  total_revenue: string;
  sale_count: string;
  average_revenue: string;
}

interface PeriodComparison {
  current: {
    period: string;
    total_revenue: number;
    sale_count: number;
    average_revenue: number;
  };
  previous: {
    period: string;
    total_revenue: number;
    sale_count: number;
    average_revenue: number;
  };
  change: {
    revenue_change: number;
    revenue_change_pct: number;
    count_change: number;
    count_change_pct: number;
  };
}

function getSafeDateTruncInterval(granularity: TimeGranularity): TimeGranularity {
  if (!VALID_DATE_TRUNC_INTERVALS.has(granularity)) {
    throw new Error(`Invalid granularity: ${granularity}`);
  }
  return granularity;
}

export async function getTimeSeries(
  granularity: TimeGranularity,
  startDate?: string,
  endDate?: string,
  userId?: number,
  groupId?: number
): Promise<TimeSeriesDataPoint[]> {
  const truncFormat = getSafeDateTruncInterval(granularity);
  const params: (string | number)[] = [];
  let paramIndex = 1;

  let whereClause = '';
  const conditions: string[] = [];

  if (startDate) {
    conditions.push(`s.date >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`s.date <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }

  if (userId) {
    conditions.push(`s.user_id = $${paramIndex}`);
    params.push(userId);
    paramIndex++;
  }

  if (groupId) {
    conditions.push(`ug.group_id = $${paramIndex}`);
    params.push(groupId);
  }

  if (conditions.length > 0) {
    whereClause = 'WHERE ' + conditions.join(' AND ');
  }

  const joinClause = groupId ? 'JOIN user_groups ug ON s.user_id = ug.user_id' : '';

  const sql = `
    SELECT
      DATE_TRUNC('${truncFormat}', s.date) as period,
      SUM(s.amount) as total_revenue,
      AVG(s.amount) as average_revenue,
      COUNT(*)::integer as sale_count,
      MIN(s.amount) as min_sale,
      MAX(s.amount) as max_sale
    FROM sales s
    ${joinClause}
    ${whereClause}
    GROUP BY DATE_TRUNC('${truncFormat}', s.date)
    ORDER BY period ASC
  `;

  const result = await query<TimeSeriesRow>(sql, params);

  return result.rows.map((row) => ({
    period: formatDateString(row.period),
    total_revenue: parseNumericString(row.total_revenue),
    average_revenue: formatDecimal(row.average_revenue),
    sale_count: parseNumericString(row.sale_count),
    min_sale: row.min_sale,
    max_sale: row.max_sale,
  }));
}

export async function getUserPerformance(
  startDate?: string,
  endDate?: string,
  userId?: number,
  limit?: number,
  offset?: number
): Promise<{ data: UserPerformance[]; total: number }> {
  const params: (string | number)[] = [];
  let paramIndex = 1;
  const conditions: string[] = [];

  if (startDate) {
    conditions.push(`s.date >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`s.date <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }

  if (userId) {
    conditions.push(`u.id = $${paramIndex}`);
    params.push(userId);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  let limitClause = '';
  if (limit !== undefined) {
    limitClause = ` LIMIT $${paramIndex}`;
    params.push(limit);
    paramIndex++;
  }

  if (offset !== undefined) {
    limitClause += ` OFFSET $${paramIndex}`;
    params.push(offset);
  }

  const sql = `
    SELECT
      user_id,
      user_name,
      role,
      total_revenue,
      average_revenue,
      sale_count,
      min_sale,
      max_sale,
      total_count
    FROM (
      SELECT
        u.id as user_id,
        u.name as user_name,
        u.role,
        SUM(s.amount) as total_revenue,
        AVG(s.amount) as average_revenue,
        COUNT(*)::integer as sale_count,
        MIN(s.amount) as min_sale,
        MAX(s.amount) as max_sale,
        COUNT(*) OVER()::integer as total_count
      FROM users u
      JOIN sales s ON u.id = s.user_id
      ${whereClause}
      GROUP BY u.id, u.name, u.role
    ) aggregated
    ORDER BY total_revenue DESC
    ${limitClause}
  `;

  const result = await query<UserPerformanceRow & { total_count: number }>(sql, params);
  const total = result.rows.length > 0 ? result.rows[0].total_count : 0;

  const data = result.rows.map((row) => ({
    user_id: row.user_id,
    user_name: row.user_name,
    role: row.role,
    total_revenue: parseNumericString(row.total_revenue),
    average_revenue: formatDecimal(row.average_revenue),
    sale_count: parseNumericString(row.sale_count),
    min_sale: row.min_sale,
    max_sale: row.max_sale,
  }));

  return { data, total };
}

export async function getGroupPerformance(
  startDate?: string,
  endDate?: string,
  groupId?: number
): Promise<GroupPerformance[]> {
  const params: (string | number)[] = [];
  let paramIndex = 1;
  const conditions: string[] = [];

  if (startDate) {
    conditions.push(`s.date >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`s.date <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }

  if (groupId) {
    conditions.push(`g.id = $${paramIndex}`);
    params.push(groupId);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const sql = `
    SELECT
      g.id as group_id,
      g.name as group_name,
      SUM(s.amount) as total_revenue,
      AVG(s.amount) as average_revenue,
      COUNT(*)::integer as sale_count,
      COUNT(DISTINCT ug.user_id)::integer as user_count,
      MIN(s.amount) as min_sale,
      MAX(s.amount) as max_sale
    FROM groups g
    JOIN user_groups ug ON g.id = ug.group_id
    JOIN sales s ON ug.user_id = s.user_id
    ${whereClause}
    GROUP BY g.id, g.name
    ORDER BY total_revenue DESC
  `;

  const result = await query<GroupPerformanceRow>(sql, params);

  return result.rows.map((row) => ({
    group_id: row.group_id,
    group_name: row.group_name,
    total_revenue: parseNumericString(row.total_revenue),
    average_revenue: formatDecimal(row.average_revenue),
    sale_count: parseNumericString(row.sale_count),
    user_count: parseNumericString(row.user_count),
    min_sale: row.min_sale,
    max_sale: row.max_sale,
  }));
}

export async function getLeaderboard(
  startDate?: string,
  endDate?: string,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  const params: (string | number)[] = [];
  let paramIndex = 1;
  const conditions: string[] = [];

  if (startDate) {
    conditions.push(`s.date >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`s.date <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }

  params.push(limit);
  const limitParam = paramIndex;

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const sql = `
    SELECT
      u.id as user_id,
      u.name as user_name,
      u.role,
      SUM(s.amount) as total_revenue,
      COUNT(*)::integer as sale_count
    FROM users u
    JOIN sales s ON u.id = s.user_id
    ${whereClause}
    GROUP BY u.id, u.name, u.role
    ORDER BY total_revenue DESC
    LIMIT $${limitParam}
  `;

  const result = await query<LeaderboardRow>(sql, params);

  return result.rows.map((row, index) => ({
    rank: index + 1,
    user_id: row.user_id,
    user_name: row.user_name,
    role: row.role,
    total_revenue: parseNumericString(row.total_revenue),
    sale_count: parseNumericString(row.sale_count),
  }));
}

export async function getSummaryStats(startDate?: string, endDate?: string): Promise<SummaryStats> {
  const params: string[] = [];
  let paramIndex = 1;
  const conditions: string[] = [];

  if (startDate) {
    conditions.push(`date >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`date <= $${paramIndex}`);
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const sql = `
    SELECT
      SUM(amount) as total_revenue,
      COUNT(*)::integer as total_sales,
      AVG(amount) as average_sale,
      MIN(amount) as min_sale,
      MAX(amount) as max_sale,
      COUNT(DISTINCT user_id)::integer as unique_sellers,
      MIN(date) as first_sale_date,
      MAX(date) as last_sale_date
    FROM sales
    ${whereClause}
  `;

  const result = await query<SummaryStatsRow>(sql, params);
  const row = result.rows[0];

  return {
    total_revenue: parseNumericString(row.total_revenue),
    total_sales: parseNumericString(row.total_sales),
    average_sale: formatDecimal(row.average_sale),
    min_sale: row.min_sale,
    max_sale: row.max_sale,
    unique_sellers: parseNumericString(row.unique_sellers),
    date_range: {
      start: formatDateString(row.first_sale_date),
      end: formatDateString(row.last_sale_date),
    },
  };
}

export async function getPeriodComparison(
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string
): Promise<PeriodComparison> {
  const sql = `
    SELECT
      CASE
        WHEN date >= $1 AND date <= $2 THEN 'current'
        WHEN date >= $3 AND date <= $4 THEN 'previous'
      END as period_label,
      SUM(amount) as total_revenue,
      COUNT(*)::integer as sale_count,
      AVG(amount) as average_revenue
    FROM sales
    WHERE (date >= $1 AND date <= $2) OR (date >= $3 AND date <= $4)
    GROUP BY period_label
  `;

  const result = await query<ComparisonRow>(sql, [
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  ]);

  const currentData = result.rows.find((r) => r.period_label === 'current');
  const previousData = result.rows.find((r) => r.period_label === 'previous');

  const current = {
    period: `${currentStart} to ${currentEnd}`,
    total_revenue: currentData ? parseNumericString(currentData.total_revenue) : 0,
    sale_count: currentData ? parseNumericString(currentData.sale_count) : 0,
    average_revenue: currentData ? formatDecimal(currentData.average_revenue) : 0,
  };

  const previous = {
    period: `${previousStart} to ${previousEnd}`,
    total_revenue: previousData ? parseNumericString(previousData.total_revenue) : 0,
    sale_count: previousData ? parseNumericString(previousData.sale_count) : 0,
    average_revenue: previousData ? formatDecimal(previousData.average_revenue) : 0,
  };

  const revenueChange = current.total_revenue - previous.total_revenue;
  const countChange = current.sale_count - previous.sale_count;

  return {
    current,
    previous,
    change: {
      revenue_change: revenueChange,
      revenue_change_pct:
        previous.total_revenue > 0
          ? formatDecimal((revenueChange / previous.total_revenue) * 100)
          : 0,
      count_change: countChange,
      count_change_pct:
        previous.sale_count > 0 ? formatDecimal((countChange / previous.sale_count) * 100) : 0,
    },
  };
}
