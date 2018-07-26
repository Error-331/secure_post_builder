'use strict';

// external imports
const {join} = require('path');

// local imports

// implementation
const PATH_TO_LOGS_DIR = join(process.cwd(), 'logs');

const DAILY_ROTATE_FILE_LOG_FILE_NAME = 'app_builder_%DATE%.log';
const DAILY_ROTATE_FILE_LOG_DATE_PATTERN = 'YYYY-MM-DD-HH';
const DAILY_ROTATE_FILE_LOG_ZIPPED_ARCHIVE_FLAG = false;
const DAILY_ROTATE_FILE_LOG_MAX_SIZE = '20m';
const DAILY_ROTATE_FILE_LOG_MAX_FILES = null;

const DAILY_ROTATE_FILE_LOG_CONFIGURATION = Object.freeze({
  dirname: PATH_TO_LOGS_DIR,
  filename: DAILY_ROTATE_FILE_LOG_FILE_NAME,
  datePattern: DAILY_ROTATE_FILE_LOG_DATE_PATTERN,
  zippedArchive: DAILY_ROTATE_FILE_LOG_ZIPPED_ARCHIVE_FLAG,
  maxSize: DAILY_ROTATE_FILE_LOG_MAX_SIZE,
  maxFiles: DAILY_ROTATE_FILE_LOG_MAX_FILES
});

// exports
exports.PATH_TO_LOGS_DIR = PATH_TO_LOGS_DIR;

exports.DAILY_ROTATE_FILE_LOG_FILE_NAME = DAILY_ROTATE_FILE_LOG_FILE_NAME;
exports.DAILY_ROTATE_FILE_LOG_DATE_PATTERN = DAILY_ROTATE_FILE_LOG_DATE_PATTERN;
exports.DAILY_ROTATE_FILE_LOG_ZIPPED_ARCHIVE_FLAG = DAILY_ROTATE_FILE_LOG_ZIPPED_ARCHIVE_FLAG;
exports.DAILY_ROTATE_FILE_LOG_MAX_SIZE = DAILY_ROTATE_FILE_LOG_MAX_SIZE;
exports.DAILY_ROTATE_FILE_LOG_MAX_FILES = DAILY_ROTATE_FILE_LOG_MAX_FILES;

exports.DAILY_ROTATE_FILE_LOG_CONFIGURATION = DAILY_ROTATE_FILE_LOG_CONFIGURATION;
