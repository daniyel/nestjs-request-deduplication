# NestJS Request Deduplication

[![npm version](https://badge.fury.io/js/nestjs-request-deduplication.svg)](https://www.npmjs.com/package/nestjs-request-deduplication)
[![CI](https://github.com/daniyel/nestjs-request-deduplication/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/daniyel/nestjs-request-deduplication/actions/workflows/pr-checks.yml)
[![Coverage](https://codecov.io/gh/daniyel/nestjs-request-deduplication/branch/main/graph/badge.svg)](https://codecov.io/gh/daniyel/nestjs-request-deduplication)

A NestJS module that provides protection against duplicate requests through request deduplication. It works as an interceptor that stores request signatures in a cache for a configurable period, rejecting identical subsequent requests during that time window.

## Features

- 🚀 Multiple storage backends (Memory, Redis, Memcached)
- 🔒 Configurable TTL for deduplication window
- 🎯 Request signature generation
- 🔌 Easy integration with existing NestJS applications
- ⚡ Minimal performance overhead

## Installation

```bash
npm install nestjs-request-deduplication
```

## Quick Start

```typescript
// app.module.ts
import { RequestDeduplicationModule, StorageType } from 'nestjs-request-deduplication';

@Module({
  imports: [
    RequestDeduplicationModule.forRoot({
      storage: StorageType.MEMORY,
      ttl: 10000, // 10 seconds
    }),
  ],
})
export class AppModule {}
```

## Why Use This Module?

### Frontend to Backend Communication
- Prevents duplicate form submissions
- Handles race conditions from multiple clicks
- Protects against accidental or malicious request duplication

### Backend to Backend Communication
- Safeguards against retry storms
- Handles duplicate webhook deliveries
- Provides idempotency without implementation overhead

## Configuration Options

### Common Options
```typescript
interface RequestDeduplicationModuleOptions {
  storage?: 'memory' | 'redis' | 'memcached';  // Default: 'memory'
  ttl?: number;                                // Default: 1000ms
}
```

### Memory Storage
```typescript
// Simplest configuration - uses defaults
RequestDeduplicationModule.forRoot({
  storage: StorageType.MEMORY,
  ttl: 10000,
})
```

### Redis Storage Options
```typescript
interface RedisConfig {
  url?: string;               // Redis connection URL
  host?: string;              // Redis host
  port?: number;              // Redis port
  socket?: RedisSocketOptions;// Socket connection properties
  username?: string;          // Redis username
  password?: string;          // Redis password
  database?: number;          // Redis database number
  tls?: boolean;              // Enable TLS
  connectTimeout?: number;    // Connection timeout in ms
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
}

// Example configuration
RequestDeduplicationModule.forRoot({
  storage: StorageType.REDIS,
  ttl: 10000,
  redisConfig: {
    url: 'redis://username:password@localhost:6379/0', // or redis[s]://[[username][:password]@][host][:port][/db-number]
    // for additional individual options check @redis - RedisClientOptions
    ...
  }
})
```

### Memcached Storage Options
```typescript
interface MemcachedOptions {
  uri: string;              // Memcached connection URI
  options: {
    expires?: number;       // Default expiration time
    retries?: number;       // Number of retries
    timeout?: number;       // Operation timeout
    conntimeout?: number;   // Connection timeout
    keepAlive?: boolean;    // Keep connection alive
    keepAliveDelay?: number;// Delay between keep alive messages
    failover?: boolean;     // Enable failover
    failoverTime?: number;  // Time between failover attempts
    username?: string;      // Authentication username
    password?: string;      // Authentication password
    logger?: {              // Custom logger
      log: (message: string) => void;
    };
  }
}

// Example configuration
RequestDeduplicationModule.forRoot({
  storage: StorageType.MEMCACHED,
  ttl: 10000,
  memcachedConfig: {
    uri: 'localhost:11211',
    options: {
      retries: 3,
      timeout: 5000,
      conntimeout: 2000,
      keepAlive: true,
      keepAliveDelay: 30000,
      failover: true,
      failoverTime: 60000,
      username: 'user',
      password: 'pass'
    }
  }
})
```

### Advanced Usage Examples

#### Redis with Cluster
```typescript
RequestDeduplicationModule.forRoot({
  storage: StorageType.REDIS,
  ttl: 10000,
  redisConfig: {
    url: [
      'redis://localhost:6379',
      'redis://localhost:6380',
      'redis://localhost:6381'
    ],
    maxRetriesPerRequest: 5,
    enableReadyCheck: true
  }
})
```

#### Memcached with Multiple Servers
```typescript
RequestDeduplicationModule.forRoot({
  storage: StorageType.MEMCACHED,
  ttl: 10000,
  memcachedConfig: {
    uri: 'localhost:11211,localhost:11212,localhost:11213',
    options: {
      failover: true,
      retries: 3
    }
  }
})
```

## Skipping Deduplication

You can skip deduplication for specific endpoints using the `@SkipDeduplicateRequest()` decorator:

```typescript
@SkipDeduplicateRequest()
@Post('/endpoint')
async someMethod() {
  // This endpoint won't use deduplication
}
```

## Considerations for Distributed Environments

When running your service in a distributed environment (e.g., Kubernetes, multiple instances), there are important considerations for the storage backend:

### Storage Backend Selection

- **Redis/Memcached**: Use these for distributed environments. Ensure you're using a distributed/clustered instance accessible to all service instances.
- **Memory Storage**: Not suitable for distributed environments as each service instance maintains its own local cache.

### Deployment Scenarios

- ✅ **Recommended**: Distributed Redis/Memcached + Multiple Service Instances
  ```
  Service Instance 1 ─┐
  Service Instance 2 ─┼─► Distributed Redis/Memcached
  Service Instance 3 ─┘
  ```

- ❌ **Not Recommended**: Local Storage + Multiple Instances
  ```
  Service Instance 1 (Local Cache)
  Service Instance 2 (Local Cache)  ► No Shared State
  Service Instance 3 (Local Cache)
  ```

### Load Balancer Configuration

- While sticky sessions might help with in-memory storage, it's not recommended as it:
  - Violates stateless principles
  - Reduces system reliability
  - Complicates scaling and failover

Choose Redis or Memcached for production deployments with multiple service instances to ensure consistent request deduplication across your entire system.

## Contributing

Contributions are welcome! Please follow these steps:

1. Create an issue describing the change you want to make
2. Fork the repository and create a feature branch following our naming convention:
   ```
   feat/123-add-new-feature
   fix/456-memory-leak
   docs/789-update-readme
   ```
3. Make your changes
4. Submit a pull request referencing the issue

### Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the module:
   ```bash
   npm run build
   ```
4. Run examples:
   ```bash
   # Memory storage example
   npm run dev --workspace=examples/memory
   # Redis storage example
   npm run dev --workspace=examples/redis
   # Memcached storage example
   npm run dev --workspace=examples/memcached
   ```

### Commit Guidelines

We use conventional commits. Examples:
```bash
git commit -m "feat(api): Add new endpoint #123"
git commit -m "fix: Resolve memory leak issue #456"
```

## License

[MIT](LICENSE)
