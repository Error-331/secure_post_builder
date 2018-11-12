'use strict';

// external imports
const {resolve} = require('path');

// local imports
const {CURRENT_BUILD_DIRECTORY_NAME, ENV_FILE_NAME} = require('./../constants/common_builds');

// implementation
function getPathToFileInDistFolder(task, fileName) {
    const {pathToDistFolder} = task.currentConfig;
    return resolve(pathToDistFolder, fileName);
}

function getPathToCurrentBuild(task) {
    const {pathToDistFolder} = task.currentConfig;
    return resolve(pathToDistFolder, CURRENT_BUILD_DIRECTORY_NAME);
}

function getPathToFileInCurrentBuild(task, fileName) {
    const currentBuildDirectoryLocation = getPathToCurrentBuild(task);
    return resolve(currentBuildDirectoryLocation, fileName);
}

function getPathToEnvFile(task) {
    return getPathToFileInDistFolder(task, ENV_FILE_NAME);
}

// exports
exports.getPathToFileInDistFolder = getPathToFileInDistFolder;
exports.getPathToCurrentBuild = getPathToCurrentBuild;
exports.getPathToFileInCurrentBuild = getPathToFileInCurrentBuild;
exports.getPathToEnvFile = getPathToEnvFile;