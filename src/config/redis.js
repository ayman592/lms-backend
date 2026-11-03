import Redis from "ioredis";

let redisClient;

export const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is required");
  }

  if (redisClient) {
    return redisClient;
  }

  const client = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,

    retryStrategy(times) {
      if (times > 10) {
        return null;
      }

      return Math.min(times * 500, 5000);
    },
  });

  client.on("connect", () => {
    console.log("Redis connection established");
  });

  client.on("ready", () => {
    console.log("Redis is ready");
  });

  client.on("error", (error) => {
    console.error("Redis error:", error.message);
  });

  try {
    await client.connect();
    await client.ping();

    redisClient = client;

    console.log("Redis connected successfully");

    return redisClient;
  } catch (error) {
    client.disconnect();
    throw error;
  }
};

export const getRedisClient = () => {
  if (!redisClient || redisClient.status !== "ready") {
    throw new Error("Redis client is not connected");
  }

  return redisClient;
};
