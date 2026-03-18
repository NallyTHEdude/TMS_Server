import winston from "winston";
import { config } from "../config/index.js";

const isDevEnv = config.NODE_ENV === "development"; // can only be develpment or production

// defining log format for dev and prod environment
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaString = Object.keys(meta).length
        ? JSON.stringify(meta, null, 2)
        : "";

    return `${timestamp} [${level}]: ${stack || message} ${metaString}`;
 })
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// creating logger instance for dev and prod
export const logger = winston.createLogger({
  level: "info",
  format: isDevEnv ? devFormat : prodFormat,
  transports: [
    isDevEnv ? new winston.transports.Console() : new winston.transports.File({ filename: "logs/app.log" })
  ]
});