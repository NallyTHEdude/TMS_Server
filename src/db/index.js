import mongoose from 'mongoose';
import { config } from '../config/index.js';

const connetDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('✅ MongoDB connected ');
    } catch (error) {
        console.log('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

export default connetDB;
