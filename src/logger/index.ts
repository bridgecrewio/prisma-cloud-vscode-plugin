import * as winston from 'winston';

export const LOG_FILE_NAME = 'prisma.log';
let logger: winston.Logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.splat(),
        winston.format.printf(({ level, message, timestamp, ...rest }) => {
            const logError = rest.error && rest.error instanceof Error ? { error: { ...rest.error, message: rest.error.message, stack: rest.error.stack } } : {};
            const argumentsString = JSON.stringify({ ...rest, ...logError });
            return `${timestamp} [${level}]: ${message} ${argumentsString !== '{}' ? argumentsString : ''}`;
        })
    ),
    transports: [
        new winston.transports.Console({
            level: 'debug'
        })
    ]
});

export const initiateLogger = (logFileDir: string): void => {
    const fileTransport = new winston.transports.File({
        level: 'debug',
        dirname: logFileDir,
        filename: LOG_FILE_NAME
    });
    logger.add(fileTransport);
};

export default logger;