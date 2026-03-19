import dotenv from 'dotenv';

// configuring dotenv
dotenv.config({
    path: '.env',
});

export const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',

    PORT : process.env.PORT || 3000,
    BASE_URL : process.env.BASE_URL,
    CORS_ORIGIN : process.env.CORS_ORIGIN,

    MONGO_URI : process.env.MONGO_URI,

    REDIS_URL : process.env.REDIS_URL,
    REDIS_PORT : process.env.REDIS_PORT,
    REDIS_PASSWORD : process.env.REDIS_PASSWORD,

    ACCESS_TOKEN_SECRET : process.env.ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY : process.env.ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_SECRET : process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY : process.env.REFRESH_TOKEN_EXPIRY,

    GMAIL_SMTP_HOST : process.env.GMAIL_SMTP_HOST,
    GMAIL_SMTP_PORT : process.env.GMAIL_SMTP_PORT,
    GMAIL_SMTP_USERNAME : process.env.GMAIL_SMTP_USERNAME,
    GMAIL_APP_PASSWORD : process.env.GMAIL_APP_PASSWORD,

    RESET_PASSWORD_REDIRECT_URL : process.env.RESET_PASSWORD_REDIRECT_URL,

    CLOUDINARY_CLOUD_NAME : process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY : process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET : process.env.CLOUDINARY_API_SECRET,

}