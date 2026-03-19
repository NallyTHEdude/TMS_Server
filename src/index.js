import app from './app.js';
import { config } from './config/index.js';
import connectDB from './db/index.js';
import { logger } from './utils/logger.js';
import { connectRedis } from './utils/redis.js';

// initializing express application
const PORT = config.PORT;
const BASE_URL = config.BASE_URL;

await connectDB()
await connectRedis()

//app listener
app.listen(PORT, () => {
    logger.info(`Server is running at ${BASE_URL}:${PORT}`);
    if(config.NODE_ENV !== 'development'){
        console.log(`Server is running at ${BASE_URL}:${PORT}`);
    }
});