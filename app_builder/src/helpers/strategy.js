'use strict';

// external imports
const {resolve} = require('path');
const {F, tryCatch} = require('ramda');

// local imports
const {OLD_BUILD_DIRECTORY_NAME, CURRENT_BUILD_DIRECTORY_NAME} = require('./../constants/common_builds');

const {isPathReadableSync} = require('./file_system');

// implementation
function getPathToSourceArchiveFile(task) {
  const {pathToSourceFolder, archiveFileNameToWatch} = task.currentConfig;
  return resolve(pathToSourceFolder, archiveFileNameToWatch);
}

function getPathToDestinationArchiveFile(task) {
  const {pathToDistFolder, archiveFileNameToWatch} = task.currentConfig;
  return resolve(pathToDistFolder, archiveFileNameToWatch);
}

function getPathToDestinationOldBuildDir(task) {
  const {pathToDistFolder} = task.currentConfig;
  return resolve(pathToDistFolder, OLD_BUILD_DIRECTORY_NAME);
}

function getPathToDestinationCurrentBuildDir(task) {
  const {pathToDistFolder} = task.currentConfig;
  return resolve(pathToDistFolder, CURRENT_BUILD_DIRECTORY_NAME);
}

function isArchiveFileExistsInSourceDir(task) {
  const pathToWatchedFile = getPathToSourceArchiveFile(task);
  return tryCatch(isPathReadableSync, F)(pathToWatchedFile);
}

function isOldBuildDirExistInDestinationDir(task) {
  const pathToOldCurrentBuildDir = getPathToDestinationOldBuildDir(task);
  return tryCatch(isPathReadableSync, F)(pathToOldCurrentBuildDir);
}

function isCurrentBuildDirExistInDestinationDir(task) {
  const pathToDestinationCurrentBuildDir = getPathToDestinationCurrentBuildDir(task);
  return tryCatch(isPathReadableSync, F)(pathToDestinationCurrentBuildDir);
}

// exports
exports.getPathToSourceArchiveFile = getPathToSourceArchiveFile;
exports.getPathToDestinationArchiveFile = getPathToDestinationArchiveFile;
exports.getPathToDestinationOldBuildDir = getPathToDestinationOldBuildDir;
exports.getPathToDestinationCurrentBuildDir = getPathToDestinationCurrentBuildDir;

exports.isArchiveFileExistsInSourceDir = isArchiveFileExistsInSourceDir;
exports.isOldBuildDirExistInDestinationDir = isOldBuildDirExistInDestinationDir;
exports.isCurrentBuildDirExistInDestinationDir = isCurrentBuildDirExistInDestinationDir;