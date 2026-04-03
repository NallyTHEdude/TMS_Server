import { createClient } from 'redis';
import { logger } from './logger.js';
import { config } from '../config/index.js';

const prodURL = `redis://${config.REDIS_PASSWORD ? `:${encodeURIComponent(config.REDIS_PASSWORD)}@` : ''}${config.REDIS_HOST}:${config.REDIS_PORT}`;

const redisClient = createClient({
    url: config.REDIS_URL || prodURL,
});

// redis client event handlers
redisClient.on('error', (err) => {
    logger.error('Redis Client Error: ', err);
});

redisClient.on('connect', () => {
    logger.info('Redis connected');
});

redisClient.on('ready', () => {
    logger.info('Redis is ready');
});

// redis client functions
const connectRedis = async () => {
    try {
        if (redisClient.isOpen) return;
        await redisClient.connect();
    } catch (err) {
        logger.error('Failed to connect to Redis: ', err);
    }
};

const setDataToRedis = async (key, value, expiryInSeconds = 3600) => {
    try {
        if (!redisClient.isReady) {
            logger.warn(
                `Redis client is not ready. Skipping cache set for key: ${key}`,
            );
            return;
        }
        await redisClient.set(key, JSON.stringify(value), {
            EX: expiryInSeconds,
        });
    } catch (err) {
        logger.error('Failed to set data to Redis: ', err);
    }
};

const getDataFromRedis = async (key) => {
    try {
        if (!redisClient.isReady) {
            logger.warn('Redis client is not ready. Skipping cache retrieval.');
            return null;
        }
        const data = await redisClient.get(key);

        if (data) {
            logger.info(`Cache hit for key: ${key}`);
            return JSON.parse(data);
        }

        logger.info(`Cache miss for key: ${key}`);
        return null;
    } catch (err) {
        logger.error('Failed to get data from Redis: ', err);
        return null;
    }
};

const deleteDataFromRedis = async (key) => {
    try {
        if (!redisClient.isReady) {
            logger.warn(
                `Redis client is not ready. Skipping cache deletion for key: ${key}`,
            );
            return;
        }
        await redisClient.del(key);
    } catch (err) {
        logger.error('Failed to delete data from Redis: ', err);
    }
};

export { connectRedis, setDataToRedis, getDataFromRedis, deleteDataFromRedis };
