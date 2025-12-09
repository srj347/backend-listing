import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { router } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { checkDbConnection } from './services/db.service.js';
import { checkRabbitMQConnection } from './services/rabbitmq.service.js';
import { logger } from './utils/logger.js';
import { SERVER_CONFIG, API_CONFIG } from './constants/index.js';

const app: Express = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: SERVER_CONFIG.CORS_ORIGIN,
  methods: SERVER_CONFIG.CORS_METHODS,
  allowedHeaders: SERVER_CONFIG.CORS_HEADERS,
}));

// Compression
app.use(compression());

app.use(morgan(logger.isProduction() ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: SERVER_CONFIG.BODY_LIMIT }));
app.use(express.urlencoded({ extended: true }));

// ROUTES

// Health check
app.get(API_CONFIG.HEALTH_PATH, async (_req, res) => {
  const dbHealthy = await checkDbConnection();
  const rabbitHealthy = await checkRabbitMQConnection();
  
  const status = dbHealthy && rabbitHealthy ? 'healthy' : 'degraded';
  const statusCode = status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'up' : 'down',
      rabbitmq: rabbitHealthy ? 'up' : 'down',
    },
  });
});

// API routes
app.use(API_CONFIG.BASE_PATH, router);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
  });
});

// Error handler
app.use(errorHandler);

// SERVER START

const startServer = async (): Promise<void> => {
  try {
    // Verify database connection on startup
    const dbConnected = await checkDbConnection();
    if (!dbConnected) {
      logger.warn('Database connection not available at startup');
    } else {
      logger.info('Database connection established');
    }

    // Verify RabbitMQ connection
    const rabbitConnected = await checkRabbitMQConnection();
    if (!rabbitConnected) {
      logger.warn('RabbitMQ connection not available at startup');
    } else {
      logger.info('RabbitMQ connection established');
    }

    app.listen(SERVER_CONFIG.PORT, () => {
      logger.info('Listing API Service started', {
        port: SERVER_CONFIG.PORT,
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
          api: `http://localhost:${SERVER_CONFIG.PORT}${API_CONFIG.BASE_PATH}`,
          health: `http://localhost:${SERVER_CONFIG.PORT}${API_CONFIG.HEALTH_PATH}`,
        },
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();

export { app };
