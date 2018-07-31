'use strict';

// external imports
const {createLogger, format, transports} = require('winston');
require('winston-daily-rotate-file');

const {is, isNil, isEmpty, defaultTo, complement, equals, unless, curry, forEach} = require('ramda');

// local imports
const {
    DAILY_ROTATE_FILE_LOG_CONFIGURATION,
    DAILY_ROTATE_INOTIFY_FILE_LOG_CONFIGURATION,
    DAILY_ROTATE_EXECA_FILE_LOG_CONFIGURATION
} = require('./../constants/logs');

// implementation
let logger = null;
let inotifyLogger = null;
let execaLogger = null;

function createWinstonLogger(configuration, formatConfiguration) {
    const dailyRotateFileTransport = new (transports.DailyRotateFile)(configuration);
    const logger = createLogger({
        format: defaultTo(format.json())(formatConfiguration),
        transports: [
            dailyRotateFileTransport
        ]
    });

    unless(equals('production'), () => logger.add(new transports.Console()))(process.env.NODE_ENV);
    return logger;
}

function createDefaultLogger() {
    return createWinstonLogger(DAILY_ROTATE_FILE_LOG_CONFIGURATION);
}

function createInotifyLogger() {
    return createWinstonLogger(DAILY_ROTATE_INOTIFY_FILE_LOG_CONFIGURATION);
}

function createExecaLogger() {
    const {combine, timestamp, printf} = format;

    const formatConfiguration = combine(
        timestamp(),
        printf((info) => `${info.timestamp} [${info.label}] code: ${info.code}; ${info.level}: ${info.message}`)
    );

    return createWinstonLogger(DAILY_ROTATE_EXECA_FILE_LOG_CONFIGURATION, formatConfiguration)
}

function getDefaultLogger() {
    logger = unless(complement(isNil), createDefaultLogger)(logger);
    return logger;
}

function getInotifyLogger() {
    inotifyLogger = unless(complement(isNil), createInotifyLogger)(inotifyLogger);
    return inotifyLogger;
}

function getExecaLogger() {
    execaLogger = unless(complement(isNil), createExecaLogger)(execaLogger);
    return execaLogger;
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

function logExeca(taskName, execaResults) {
    const currentLogger = getExecaLogger();

    if (complement(is)(Array, execaResults)) {
        execaResults = [execaResults];
    }

    forEach((execaResult) => {
        const isError = complement(isEmpty)(execaResult.stderr);

        currentLogger.log({
            level: isError ? 'error' : 'info',
            label: execaResult.cmd,
            code: execaResult.code,
            message: isError ? execaResult.stderr : execaResult.stdout
        });
    }, execaResults)

}

// exports
exports.getDefaultLogger = getDefaultLogger;
exports.log = log;

exports.logInfo = logInfo;
exports.logWarn = logWarn;
exports.logError = logError;

exports.logInotifyEvent = logInotifyEvent;
exports.logExeca = logExeca;


