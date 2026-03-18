import app from './app.js';
import { config } from './config/index.js';
import connectDB from './db/index.js';
import { logger } from './utils/logger.js';
// initializing express application
const PORT = config.PORT;
const BASE_URL = config.BASE_URL;

await connectDB()

//app listener
app.listen(PORT, () => {
    logger.info(`Server is running at ${BASE_URL}:${PORT}`);
});