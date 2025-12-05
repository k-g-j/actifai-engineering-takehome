# Actifai Engineering Takehome

## Introduction

You are an Actifai backend engineer managing a database of our users - who are call center agents - and the sales that
the users place using our application.

The database has 4 tables:

- `users`: who are the users (name, role)
- `groups`: groups of users
- `user_groups`: which users belong to which groups
- `sales`: who made a sale, for how much, and when was it made

The front-end team has decided to build an analytics and reporting dashboard to display information about performance
to our users. They are interested in tracking which users and groups are performing well (in terms of their sales). The
primary metric they have specified as a requirement is average revenue and total revenue by user and group, for a given
month.

Your job is to build the API that will deliver data to this dashboard. In addition to the stated requirements above, we
would like to see you think about what additional data/metrics would be useful to add.

At a minimum, write one endpoint that returns time series data for user sales i.e. a list of rows, where each row
corresponds to a time window and information about sales. When you design the endpoint, think  about what query
parameters and options you want to support, to allow flexibility for the front-end team.

## Codebase

This repository contains a bare-bones Node/Express server, which is defined in `server.js`. This file is where you will
define your endpoints.

## Getting started

1. Install Docker (if you don't already have it)
2. Run `npm i` to install dependencies
3. Run `docker-compose up` to compile and run the images.
4. You now have a database and server running on your machine. You can test it by navigating to `http://localhost:3000/health` in
your browser. You should see a "Hello World" message.


## Help

If you have any questions, feel free to reach out to your interview scheduler for clarification!

## API Endpoints

All endpoints return JSON with a consistent `{ success, data, meta }` structure.

### `GET /api/sales/timeseries`
Time series sales data aggregated by configurable time periods.

**Query Parameters:**
- `granularity`: `day` | `week` | `month` | `quarter` | `year` (default: `month`)
- `start_date`, `end_date`: Date range filter (YYYY-MM-DD)
- `user_id`: Filter by user
- `group_id`: Filter by group

**Returns:** `period`, `total_revenue`, `average_revenue`, `sale_count`, `min_sale`, `max_sale`

### `GET /api/sales/users`
Performance metrics aggregated by user.

**Query Parameters:**
- `start_date`, `end_date`: Date range filter (YYYY-MM-DD)
- `user_id`: Filter to specific user
- `limit`, `offset`: Pagination (limit: 1-100)

**Returns:** `user_id`, `user_name`, `role`, `total_revenue`, `average_revenue`, `sale_count`, `min_sale`, `max_sale`

### `GET /api/sales/groups`
Performance metrics aggregated by group.

**Query Parameters:**
- `start_date`, `end_date`: Date range filter (YYYY-MM-DD)
- `group_id`: Filter to specific group

**Returns:** `group_id`, `group_name`, `total_revenue`, `average_revenue`, `sale_count`, `user_count`, `min_sale`, `max_sale`

### `GET /api/sales/leaderboard`
Ranked list of top performers by total revenue.

**Query Parameters:**
- `start_date`, `end_date`: Date range filter (YYYY-MM-DD)
- `limit`: Number of results (default: 10, max: 100)

**Returns:** `rank`, `user_id`, `user_name`, `role`, `total_revenue`, `sale_count`

### `GET /api/sales/summary`
Overall sales statistics for the specified period.

**Query Parameters:**
- `start_date`, `end_date`: Date range filter (YYYY-MM-DD)

**Returns:** `total_revenue`, `total_sales`, `average_sale`, `min_sale`, `max_sale`, `unique_sellers`, `date_range`

### `GET /api/sales/compare`
Compare metrics between two time periods with percentage changes.

**Query Parameters (all required):**
- `current_start`, `current_end`: Current period range
- `previous_start`, `previous_end`: Previous period range

**Returns:** `current` and `previous` period metrics, plus `change` with `revenue_change`, `revenue_change_pct`, `count_change`, `count_change_pct`

## Running Tests

```bash
npm test              # Run unit tests
npm run test:coverage # Run tests with coverage report
```

## Design Decisions

**TypeScript**: Converted from JavaScript to TypeScript with strict mode for compile-time type safety and improved maintainability.

**Project Structure**: Separated concerns into `types/`, `constants/`, `utils/`, `db/`, and `routes/` directories for clear organization.

**Security**:
- Parameterized SQL queries to prevent injection attacks
- Input validation on all query parameters
- Helmet middleware for security headers
- Rate limiting (100 requests/15 minutes)

**Performance**:
- Database-level aggregations (SUM, AVG, COUNT) instead of application-level loops
- Connection pooling with configured limits and timeouts

**API Design**:
- Consistent `{ success, data, meta }` response structure
- Specific error codes for debugging
- Flexible filtering and pagination options

## Future Enhancements

- **Caching**: Redis layer for frequently accessed data (leaderboards, summaries)
- **Real-Time**: WebSocket support for live dashboard updates
- **Analytics**: Trend analysis, forecasting, goal tracking, percentile rankings
- **Filtering**: Role-based filtering, multi-select, date presets
- **Auth**: JWT authentication with role-based access control
- **Export**: CSV/Excel export endpoints
