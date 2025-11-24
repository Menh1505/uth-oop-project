import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'DD-MM-YYYY HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `[${timestamp}] ${level.toUpperCase()}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      )
    })
  ]
});

export default logger;