import { Express } from 'express';
import { Server as HttpServer } from 'http';

/**
 * Interface for configuring the `Server` class with Express application options.
 *
 * @property app - The Express application instance to start.
 * @property port - The port number on which the server will listen.
 * @property onInfrastructureCheck - Optional callback function for infrastructure health checks; returns a status record.
 * @property onExtraChecks - Optional callback function for additional checks to be performed before starting the server.
 */
interface ExpressAppStarterOptions {
  app: Express;
  port: number;
  onInfrastructureCheck?: () => Promise<Record<string, unknown>>;
  onExtraChecks?: () => Promise<void>;
}

/**
 * Server class to initialize and manage the Express application with advanced startup and shutdown handling.
 *
 * This class:
 * - Starts the Express server on a specified port.
 * - Performs optional infrastructure and extra checks before starting.
 * - Handles uncaught exceptions and unhandled rejections for stability.
 * - Gracefully shuts down on termination signals (e.g., SIGINT, SIGTERM).
 */
export class Server {
  private readonly expressApp: Express;
  private readonly listenPort: number;
  private readonly infrastructureCheck?: () => Promise<Record<string, unknown>>;
  private readonly extraStartupChecks?: () => Promise<void>;

  /**
   * Constructs the Server instance with the provided options.
   *
   * @param options - Configuration options for initializing the server.
   */
  constructor(options: ExpressAppStarterOptions) {
    this.expressApp = options.app;
    this.listenPort = options.port;
    this.infrastructureCheck = options.onInfrastructureCheck;
    this.extraStartupChecks = options.onExtraChecks;
  }

  /**
   * Starts the Express server, performing optional pre-startup checks and setting up graceful shutdown.
   */
  public async start(): Promise<void> {
    this.setupUncaughtExceptionHandling();

    // Perform infrastructure checks if the `onInfrastructureCheck` callback is provided.
    if (this.infrastructureCheck) {
      const status = await this.infrastructureCheck();
      console.log(`Infrastructure status: ${JSON.stringify(status)}.`);
    }

    // Execute additional checks if `onExtraChecks` callback is provided.
    if (this.extraStartupChecks) {
      await this.extraStartupChecks();
      console.log('All additional startup checks passed!');
    }

    // Start the server on the specified port and log the startup message.
    const httpServer = this.expressApp.listen(this.listenPort, () => {
      console.log(
        `API is running on port ${this.listenPort} in ${process.env.NODE_ENV} mode!`,
      );
    });

    this.setupGracefulShutdown(httpServer);
  }

  /**
   * Sets up handling for uncaught exceptions, which logs the error and exits the application.
   *
   * - Captures exceptions that are not handled elsewhere, ensuring they do not destabilize the server.
   * - Logs the error details and initiates a shutdown to avoid unpredictable behavior.
   */
  private setupUncaughtExceptionHandling(): void {
    process.on('uncaughtException', (error: Error) => {
      console.error('Unhandled exception 💥! Shutting down the application.');
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      process.exit(1); // Exit with code 1 to indicate failure.
    });
  }

  /**
   * Sets up graceful shutdown handling for the server on termination signals or unhandled promise rejections.
   *
   * This ensures the server closes all connections and releases resources properly, avoiding abrupt termination.
   *
   * @param httpServer - The HTTP server instance to close gracefully.
   */
  private setupGracefulShutdown(httpServer: HttpServer): void {
    /**
     * Handles shutdown logic, triggered by termination signals or unhandled rejections.
     *
     * @param reason - Reason for shutdown (e.g., signal type or error cause).
     * @param exitCode - Exit code to be used on process termination.
     */
    const shutdownHandler = (reason: string, exitCode: number): void => {
      console.log(`Initiating server shutdown due to ${reason}`);
      httpServer.close(() => {
        console.log('Closed all active connections.');
        process.exit(exitCode);
      });
    };

    // Capture unhandled promise rejections, log the error, and initiate shutdown.
    process.on('unhandledRejection', (error: Error) => {
      console.error(
        'Unhandled promise rejection 💥! Shutting down the application.',
      );
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      shutdownHandler('unhandledRejection', 1);
    });

    // Listen for termination signals and trigger graceful shutdown.
    process.on('SIGINT', () => shutdownHandler('SIGINT', 0));
    process.on('SIGQUIT', () => shutdownHandler('SIGQUIT', 0));
    process.on('SIGTERM', () => shutdownHandler('SIGTERM', 0));
  }
}
