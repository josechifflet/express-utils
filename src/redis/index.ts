import IORedis, { Redis as RedisClientType } from 'ioredis';

/**
 * Redis class for managing and providing a Redis client instance with lazy initialization.
 *
 * This class allows for secure connection to a Redis database using provided host, port,
 * and password credentials. The Redis client is only instantiated when `getClient` is called,
 * following a lazy initialization pattern to optimize resource usage.
 */
export class Redis {
  // Holds the Redis client instance, created on-demand.
  private clientInstance: RedisClientType;

  // Redis connection configuration properties.
  private readonly redisHost: string;
  private readonly redisPassword: string;
  private readonly redisPort: number;

  /**
   * Constructs the Redis class with the required connection parameters.
   *
   * @param redisHost - Redis server host address.
   * @param redisPassword - Password for authenticating with the Redis server.
   * @param redisPort - Port number for connecting to the Redis server.
   */
  constructor(redisHost: string, redisPassword: string, redisPort: number) {
    this.redisHost = redisHost;
    this.redisPassword = redisPassword;
    this.redisPort = redisPort;
  }

  /**
   * Returns the Redis client instance, creating it if it does not already exist.
   *
   * The client is instantiated with the host, password, and port configuration on the first
   * call, following lazy initialization. This avoids creating an unnecessary connection
   * if Redis is not used immediately, optimizing resource management.
   *
   * @returns The Redis client instance for executing Redis commands.
   */
  public getClient(): RedisClientType {
    if (!this.clientInstance) {
      // Initialize the Redis client with connection options only once.
      this.clientInstance = new IORedis({
        host: this.redisHost,
        password: this.redisPassword,
        port: this.redisPort,
      });
    }
    return this.clientInstance;
  }
}
