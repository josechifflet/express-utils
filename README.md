# express-utils

A collection of utilities and middlewares for Express.js applications, created primarily for experimental purposes and use in my personal projects. This package provides ready-to-use components for handling common backend requirements in an Express setup.

**⚠️ Disclaimer**: This project was developed for personal use. Use at your own risk.

## Installation

```bash
yarn add @mark01/express-utils
```

## Features

### Core Utilities (`/src/core`)

Utilities for JWT management, Base32 encoding/decoding, and other cryptographic functions.

### Error Handling (`/src/error`)

Custom error classes (like `AppError`) for standardized error handling across the application.

### Middleware (`/src/middlewares`)

Pre-configured middleware functions for:

- Rate limiting
- Server busy handling
- Security headers and protection

### Redis Utilities (`/src/redis`)

Integration helpers for Redis, including connection management and usage as a rate limiter store.

### Server Configuration (`/src/server`)

A `Server` class to set up and configure Express with custom middlewares, error handling, and graceful shutdown capabilities.

### Utility Functions (`/src/util`)

Helper functions for encoding, hashing, and device information extraction.

## Testing

Run tests with Vitest:

```bash
yarn test
```

## Folder Structure

- **`/src/api`**: API-specific logic and handlers.
- **`/src/core`**: Core utility modules, including JWT and Base32 operations.
- **`/src/error`**: Error handling classes and functions.
- **`/src/middlewares`**: Common middleware functions for Express apps.
- **`/src/redis`**: Redis-related utilities for caching and rate limiting.
- **`/src/server`**: Server initialization and configuration logic.
- **`/src/util`**: Utility functions (e.g., device info extraction, Base32 encoding).

## Contributing

This project is primarily for personal use, but contributions are welcome. Please open issues or submit pull requests if you find bugs or have improvements.
