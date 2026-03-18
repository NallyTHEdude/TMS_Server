import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const connetDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);
        logger.info('✅ MongoDB connected ');
    } catch (error) {
        logger.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connetDB;
