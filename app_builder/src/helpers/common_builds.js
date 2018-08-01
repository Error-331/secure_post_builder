'use strict';

// external imports
const {resolve} = require('path');

// local imports
const {CURRENT_BUILD_DIRECTORY_NAME, ENV_FILE_NAME} = require('./../constants/common_builds');

// implementation
function getPathToEnvFile(task) {
    const {pathToDistFolder} = task.currentConfig;
    return resolve(pathToDistFolder, ENV_FILE_NAME);
}

function gatPathToCurrentBuild(task) {
    const {pathToDistFolder} = task.currentConfig;
    return resolve(pathToDistFolder, CURRENT_BUILD_DIRECTORY_NAME);
}

// exports
exports.getPathToEnvFile = getPathToEnvFile;
exports.gatPathToCurrentBuild = gatPathToCurrentBuild;