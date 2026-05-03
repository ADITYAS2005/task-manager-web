const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const transports = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  }),
];

if (process.env.NODE_ENV === 'production') {
  try {
    const DailyRotateFile = require('winston-daily-rotate-file');
    transports.push(
      new DailyRotateFile({
        filename: path.join('logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: '14d',
        format: prodFormat,
      }),
      new DailyRotateFile({
        filename: path.join('logs', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        format: prodFormat,
      })
    );
  } catch (_) {}
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
});

module.exports = logger;
