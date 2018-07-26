'use strict';

// external imports
const winston = require('winston');
require('winston-daily-rotate-file');

const {isNil, complement, equals, unless, curry} = require('ramda');

// local imports
const {
    DAILY_ROTATE_FILE_LOG_CONFIGURATION,
    DAILY_ROTATE_INOTIFY_FILE_LOG_CONFIGURATION,
} = require('./../constants/logs');

// implementation
let logger = null;
let inotifyLogger = null;

function createLogger(configuration) {
    const dailyRotateFileTransport = new (winston.transports.DailyRotateFile)(configuration);
    const logger = winston.createLogger({
        format: winston.format.json(),
        transports: [
            dailyRotateFileTransport
        ]
    });

    unless(equals('production'), () => logger.add(new winston.transports.Console()))(process.env.NODE_ENV);
    return logger;
}

function createDefaultLogger() {
    return createLogger(DAILY_ROTATE_FILE_LOG_CONFIGURATION);
}

function createInotifyLogger() {
    return createLogger(DAILY_ROTATE_INOTIFY_FILE_LOG_CONFIGURATION);
}

function getDefaultLogger() {
    logger = unless(complement(isNil), createDefaultLogger)(logger);
    return logger
}

function getInotifyLogger() {
    inotifyLogger = unless(complement(isNil), createInotifyLogger)(inotifyLogger);
    return inotifyLogger
}

function log(level, message)  {
    const currentLogger = getDefaultLogger();
    currentLogger.log({level, message});
}

const logInfo = curry(log)('info');
const logWarn = curry(log)('warn');
const logError = curry(log)('error');

function logInotifyEvent(taskName, watchName, event) {
    const currentLogger = getInotifyLogger();

    const {watch, mask, cookie, name} = event;
    currentLogger.log({
        level: 'info',
        message: `Inotify event(watch: ${watch}, mask: ${mask}, cookie: ${cookie}, name: '${name}') for '${watchName}' watch of task '${taskName}'`
    });
}

// exports
exports.getDefaultLogger = getDefaultLogger;
exports.log = log;

exports.logInfo = logInfo;
exports.logWarn = logWarn;
exports.logError = logError;
exports.logInotifyEvent = logInotifyEvent;


