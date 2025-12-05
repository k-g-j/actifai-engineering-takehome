import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { seedDatabase } from './seed';
import salesRoutes from './routes/sales';
import { HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES, RATE_LIMIT } from './constants';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const limiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: ERROR_MESSAGES.RATE_LIMIT,
    },
  },
});

async function start(): Promise<void> {
  await seedDatabase();

  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(limiter);
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req: Request, res: Response) => {
    res.send('Hello World');
  });

  app.use('/api/sales', salesRoutes);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: ERROR_MESSAGES.INTERNAL,
      },
    });
  });

  app.use((_req: Request, res: Response) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: ERROR_MESSAGES.NOT_FOUND,
      },
    });
  });

  app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
