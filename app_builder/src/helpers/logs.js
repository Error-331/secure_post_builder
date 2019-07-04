'use strict';

// external imports
const {join} = require('path');

const {createLogger, format, transports} = require('winston');
require('winston-daily-rotate-file');

const {is, isNil, isEmpty, defaultTo, clone, complement, equals, unless, curryN, forEach} = require('ramda');
const {Map} = require('immutable');

// local imports
const {
    DAILY_ROTATE_FILE_LOG_CONFIGURATION,
    DAILY_ROTATE_INOTIFY_FILE_LOG_CONFIGURATION,
    DAILY_ROTATE_EXECA_FILE_LOG_CONFIGURATION
} = require('./../constants/logs');

// implementation
let defaultLogger = null;
let defaultExecaLogger = null;
let defaultInotifyLogger = null;

let loggers = Map();
let execaLoggers = Map();
let inotifyLoggers = Map();

function createWinstonLogger(configuration, formatConfiguration) {
    const dailyRotateFileTransport = new (transports.DailyRotateFile)(configuration);
    const defaultLogger = createLogger({
        format: defaultTo(format.json())(formatConfiguration),
        transports: [
            dailyRotateFileTransport
        ]
    });

    unless(equals('production'), () => defaultLogger.add(new transports.Console()))(process.env.NODE_ENV);
    return defaultLogger;
}

function createDefaultLogger() {
    return createWinstonLogger(DAILY_ROTATE_FILE_LOG_CONFIGURATION);
}

function createRegularLogger(taskName) {
    const loggerConfig = clone(DAILY_ROTATE_FILE_LOG_CONFIGURATION);

    loggerConfig.dirname = join(loggerConfig.dirname, taskName);
    return createWinstonLogger(loggerConfig);
}

function createInotifyLogger(taskName) {
    if (isNil(taskName)) {
        return createWinstonLogger(DAILY_ROTATE_INOTIFY_FILE_LOG_CONFIGURATION);
    } else {
        const loggerConfig = clone(DAILY_ROTATE_INOTIFY_FILE_LOG_CONFIGURATION);
        loggerConfig.dirname = join(loggerConfig.dirname, taskName);

        return createWinstonLogger(loggerConfig);
    }
}

function createExecaLogger(taskName) {
    const {combine, timestamp, printf} = format;

    const formatConfiguration = combine(
        timestamp(),
        printf((info) => `${info.timestamp} [${info.label}] code: ${info.code}; ${info.level}: ${info.message}`)
    );

    if (isNil(taskName)) {
        return createWinstonLogger(DAILY_ROTATE_EXECA_FILE_LOG_CONFIGURATION, formatConfiguration);
    } else {
        const loggerConfig = clone(DAILY_ROTATE_EXECA_FILE_LOG_CONFIGURATION);
        loggerConfig.dirname = join(loggerConfig.dirname, taskName);

        return createWinstonLogger(loggerConfig, formatConfiguration);
    }
}

function getLogger(taskName) {
    const logger = unless(complement(isNil), () => createRegularLogger(taskName))(loggers.get(taskName));
    loggers = loggers.set(taskName, logger);

    return logger;
}

function getDefaultLogger() {
    defaultLogger = unless(complement(isNil), createDefaultLogger)(defaultLogger);
    return defaultLogger;
}

function getInotifyLogger(taskName) {
    let logger;

    if (complement(isNil)(taskName)) {
        logger = unless(complement(isNil), () => createInotifyLogger(taskName))(inotifyLoggers.get(taskName));
        inotifyLoggers = inotifyLoggers.set(taskName, logger);
    } else {
        logger = unless(complement(isNil), () => createInotifyLogger())(defaultInotifyLogger);
        defaultInotifyLogger = logger;
    }

    return logger;
}

function getExecaLogger(taskName) {
    let logger;

    if (complement(isNil)(taskName)) {
        logger = unless(complement(isNil), () => createExecaLogger(taskName))(execaLoggers.get(taskName));
        execaLoggers = execaLoggers.set(taskName, logger);
    } else {
        logger = unless(complement(isNil), () => createExecaLogger())(defaultExecaLogger);
        defaultExecaLogger = logger;
    }

    return logger;
}

function log(level, message, taskName)  {
    let currentLogger;

    if (complement(isNil)(taskName)) {
        currentLogger = getLogger(taskName);
    } else {
        currentLogger = getDefaultLogger();
    }

    currentLogger.log({level, message});
}

const logInfo = curryN(2, log)('info');
const logWarn = curryN(2, log)('warn');
const logError = curryN(2, log)('error');

function logInotifyEvent(taskName, watchName, event) {
    const currentLogger = getInotifyLogger(taskName);

    const {watch, mask, cookie, name} = event;
    currentLogger.log({
        level: 'info',
        message: `Inotify event(watch: ${watch}, mask: ${mask}, cookie: ${cookie}, name: '${name}') for '${watchName}' watch of task '${taskName}'`
    });
}

function logExeca(taskName, execaResults) {
    const currentLogger = getExecaLogger(taskName);

    if (complement(is)(Array, execaResults)) {
        execaResults = [execaResults];
    }

    forEach((execaResult) => {
        if (isNil(execaResult)) {
            return;
        }

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


