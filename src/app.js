import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// initializing express application
const app = express();

//basic app confiduration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// cors configuration
app.use(
    cors({
        origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);

// routes import
import healthCheckRouter from './routes/healthCheck.routes.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import propertyRouter from './routes/property.routes.js';
import landlordRouter from './routes/landlord.routes.js';

// routes
app.use('/api/v1/health', healthCheckRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/property', propertyRouter);
app.use('/api/v1/landlord', landlordRouter);

app.get('/', (req, res) => {
    res.send('Welcome to BaseCampy');
});

export default app;
