'use strict';

// external imports

// local imports
const {logInfo, logError, logExeca} = require('./../../helpers/logs');

const {makeBuildFromArchive} = require('./../../flows/common_builds');
const {stopPM2TaskByNameSilent, reloadPM2TaskByEcosystemFileInCurrentBuild} = require('./../../flows/nodejs/common_nodejs_builds');

const {runCommonStrategy} = require('./../../helpers/strategy');

// implementation
const initTaskFlows = async (task, taskName) => {
    // log start of the flow
    logInfo(`Starting 'PM2 NodeJS Simple' flows for task '${taskName}'`, taskName);

    try {
        logInfo(`Starting 'stop PM2 task by name silent' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await stopPM2TaskByNameSilent(task));

        logInfo(`Starting 'make build from archive' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await makeBuildFromArchive(task));

        logInfo(`Starting 'reload PM2 task by ecosystem file in current build' flows for task '${taskName}'`, taskName);
        logExeca(taskName, await reloadPM2TaskByEcosystemFileInCurrentBuild(task));
    } catch (error) {
        console.error(error);
        logError(`Error while performing 'PM2 NodeJS Simple' flows for task '${taskName}': ${error.message}`, taskName);
    }

    // log end of the flow
    logInfo(`Ending 'PM2 NodeJS Simple' flows for task '${taskName}'`, taskName);
};

const pm2NodejsSimple = (task, taskName) => {
    // run common strategy
    runCommonStrategy(task, taskName, initTaskFlows);
};

// exports
module.exports.initTaskFlows = initTaskFlows;
module.exports.pm2NodejsSimple = pm2NodejsSimple;