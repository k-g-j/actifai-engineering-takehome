export interface User {
  id: number;
  name: string;
  role: string;
}

export interface Group {
  id: number;
  name: string;
}

export interface Sale {
  id: number;
  user_id: number;
  amount: number;
  date: Date;
}

export interface UserGroup {
  user_id: number;
  group_id: number;
}

export interface TimeSeriesDataPoint {
  period: string;
  total_revenue: number;
  average_revenue: number;
  sale_count: number;
  min_sale: number;
  max_sale: number;
}

export interface UserPerformance {
  user_id: number;
  user_name: string;
  role: string;
  total_revenue: number;
  average_revenue: number;
  sale_count: number;
  min_sale: number;
  max_sale: number;
}

export interface GroupPerformance {
  group_id: number;
  group_name: string;
  total_revenue: number;
  average_revenue: number;
  sale_count: number;
  user_count: number;
  min_sale: number;
  max_sale: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  user_name: string;
  role: string;
  total_revenue: number;
  sale_count: number;
}

export type TimeGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface DateRange {
  start_date?: string;
  end_date?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    period?: {
      start: string;
      end: string;
    };
  };
}

export interface ApiError {
  success: boolean;
  error: {
    code: string;
    message: string;
  };
}
