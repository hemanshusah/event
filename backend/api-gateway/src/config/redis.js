const { createClient } = require('redis');

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('Redis server connection refused');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          console.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          console.error('Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis ready to accept commands');
    });

    redisClient.on('end', () => {
      console.log('Redis connection ended');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
};

// Cache helper functions
const cache = {
  // Set cache with TTL
  set: async (key, value, ttl = 3600) => {
    if (!redisClient) return null;
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  // Get cache
  get: async (key) => {
    if (!redisClient) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // Delete cache
  del: async (key) => {
    if (!redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  // Set cache with pattern
  setPattern: async (pattern, value, ttl = 3600) => {
    if (!redisClient) return false;
    try {
      const keys = await redisClient.keys(pattern);
      const pipeline = redisClient.multi();
      
      keys.forEach(key => {
        pipeline.setEx(key, ttl, JSON.stringify(value));
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache set pattern error:', error);
      return false;
    }
  },

  // Clear cache by pattern
  clearPattern: async (pattern) => {
    if (!redisClient) return false;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache clear pattern error:', error);
      return false;
    }
  }
};

// Session helper functions
const session = {
  // Set session
  set: async (sessionId, data, ttl = 86400) => { // 24 hours default
    return await cache.set(`session:${sessionId}`, data, ttl);
  },

  // Get session
  get: async (sessionId) => {
    return await cache.get(`session:${sessionId}`);
  },

  // Delete session
  del: async (sessionId) => {
    return await cache.del(`session:${sessionId}`);
  }
};

// Rate limiting helper
const rateLimit = {
  // Check rate limit
  check: async (key, limit, window) => {
    if (!redisClient) return { allowed: true, remaining: limit };
    
    try {
      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, window);
      }
      
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime: await redisClient.ttl(key)
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, remaining: limit };
    }
  }
};

module.exports = {
  redisClient,
  connectRedis,
  cache,
  session,
  rateLimit
};
