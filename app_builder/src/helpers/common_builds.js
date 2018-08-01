'use strict';

// external imports
const {resolve} = require('path');

// local imports
const {ENV_FILE_NAME} = require('./../constants/common_builds');

// implementation
function getPathToEnvFile(task) {
    const {pathToDistFolder} = task.currentConfig;
    return resolve(pathToDistFolder, ENV_FILE_NAME);
}

// exports
exports.getPathToEnvFile = getPathToEnvFile;