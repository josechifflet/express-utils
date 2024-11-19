import express, { Express, RequestHandler } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import Redis from 'ioredis';
import morgan from 'morgan';

import {
  defaultHandleOperationalErrors,
  errorHandler,
  ErrorHandlerConfig,
} from '../error';
import accept from '../middlewares/accept';
import busyHandler from '../middlewares/busy-handler';
import favicon from '../middlewares/favicon';
import { errorLogger, successLogger } from '../middlewares/logger';
import notFound from '../middlewares/not-found';
import slowDown from '../middlewares/slow-down';
import xRequestedWith from '../middlewares/x-requested-with';
import xst from '../middlewares/xst';

// Interface for configuration options passed to the Api class
export interface ApiOptions {
  handlers: { path: string; handler: RequestHandler }[]; // Array of route handlers
  redis: Redis; // Redis instance for rate limiting

  extraMiddlewares?: RequestHandler[]; // Optional custom middlewares
  apiRateLimit?: number; // Optional rate limit for API requests
  trustProxy?: boolean; // Optional flag for trusting proxy headers
  morganFormat?: string; // Optional format for request logging
  errorHandlerConfig?: ErrorHandlerConfig; // Optional config for error handling
}

// Main API class responsible for setting up and configuring an Express application
class Api {
  private app: Express; // Express instance for handling requests
  private redis: Redis; // Redis instance for rate limiting

  private readonly trustProxy: boolean;
  private readonly morganFormat: string;
  private readonly errorHandlerConfig: ErrorHandlerConfig;

  constructor(options: ApiOptions) {
    this.app = express();
    this.redis = options.redis;
    this.trustProxy = options.trustProxy ?? false; // Default to not trusting proxies
    this.morganFormat = options.morganFormat ?? 'dev'; // Default to 'dev' logging format
    this.errorHandlerConfig = options.errorHandlerConfig ?? {
      environment: 'development',
      handleOperationalErrors: defaultHandleOperationalErrors,
    };

    // Configure the application settings and apply middleware
    this.configureApp();
    this.applyMiddlewares(options.extraMiddlewares);
    this.applyHandlers(options.handlers, options.apiRateLimit);
    this.applyErrorHandlers();
  }

  // Configures basic settings and essential middleware for the application
  private configureApp(): void {
    if (this.trustProxy) this.app.enable('trust proxy'); // Trust proxy headers if enabled

    // Log requests with Morgan in the specified format
    this.app.use(morgan(this.morganFormat));

    // Use Helmet for security headers with customized options
    this.app.use(
      helmet({ frameguard: { action: 'deny' }, hidePoweredBy: false }),
    );

    // Additional custom security and utility middlewares
    this.app.use(xRequestedWith()); // Add X-Requested-With header for CSRF protection
    this.app.use(accept()); // Accept header validation
    this.app.use(busyHandler()); // Middleware to handle server busy status
    this.app.use(hpp()); // Protect against HTTP Parameter Pollution
    this.app.use(xst()); // Middleware for XST protection
    this.app.use(favicon()); // Serve a default favicon

    // Logging middleware for successful requests
    this.app.use(successLogger);
  }

  // Applies any additional middlewares provided via options
  private applyMiddlewares(extraMiddlewares?: RequestHandler[]): void {
    if (extraMiddlewares) {
      extraMiddlewares.forEach((middleware) => this.app.use(middleware));
    }
  }

  // Configures route handlers with an optional rate limit on API requests
  private applyHandlers(
    handlers: { path: string; handler: RequestHandler }[],
    apiRateLimit = 75,
  ): void {
    // Apply rate limiting middleware to all '/api' routes
    this.app.use('/api', slowDown(this.redis, apiRateLimit));

    // Register each handler at the specified path
    handlers.forEach(({ path, handler }) => {
      this.app.use(path, handler);
    });

    // Catch-all for undefined routes, returns a 404 response
    this.app.all('*', notFound());
  }

  // Configures error-handling middleware
  private applyErrorHandlers(): void {
    this.app.use(errorLogger); // Log errors before handling them
    this.app.use(errorHandler(this.errorHandlerConfig)); // Central error handling middleware
  }

  // Exposes the Express app instance for further use
  public getApp(): Express {
    return this.app;
  }
}

export default Api;
