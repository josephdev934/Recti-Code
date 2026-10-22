import winston from 'winston';

// Console only: serverless hosts like Netlify have a read-only filesystem, so writing
// log files crashes every route that imports this. Console output shows up in the
// host's function logs.
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
