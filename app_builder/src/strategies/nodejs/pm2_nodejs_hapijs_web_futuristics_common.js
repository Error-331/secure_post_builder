'use strict';

// external imports
const {defaultTo} = require('ramda');

// local imports
const {DEFAULT_PM2_ECOSYSTEM_CONFIG_FILE_NAME} = require('./../../constants/nodejs');

const {logInfo, logError, logExeca} = require('./../../helpers/logs');

const {
    getPathToFileInDistFolder,
    getPathToFileInCurrentBuild
} = require('./../../helpers/common_builds');

const {
    copyFile,
    deleteFileForce,
    makeBuildFromArchive
} = require('./../../flows/common_builds');

const {
    runNPMTask,
    stopPM2TaskByNameSilent,
    reloadPM2TaskByEcosystemFileInCurrentBuild,
} = require('./../../flows/nodejs/common_nodejs_builds');

const {runCommonStrategy} = require('./../../helpers/strategy');

// implementation
const initTaskFlows = async (task, taskName) => {
    // log start of the flow
    logInfo(`Starting 'PM2 NodeJS HapiJS WebFuturistics common' flows for task '${taskName}'`, taskName);

    try {
        logInfo(`Starting 'stop PM2 task by name silent' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await stopPM2TaskByNameSilent(task));

        logInfo(`Deleting linux socket file' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await deleteFileForce(
            task,
            getPathToFileInCurrentBuild(task, task.currentConfig.linuxSocketPath)
        ));

        logInfo(`Starting 'make build from archive' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await makeBuildFromArchive(task));

        logInfo(`Starting 'copy server specific config file' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await copyFile(
            task,
            getPathToFileInDistFolder(task, 'server_specific_config.json'),
            getPathToFileInCurrentBuild(task, 'app_server/configs')
            ));

        logInfo(`Starting 'copy frontend config file' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await copyFile(
            task,
            getPathToFileInDistFolder(task, 'frontend_config.json'),
            getPathToFileInCurrentBuild(task, 'app_front')
        ));

        logInfo(`Starting 'run NPM task' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await runNPMTask(task, 'build-frontend-production'));

        logInfo(`Starting 'reload PM2 task by ecosystem file in current build' flows for task '${taskName}'`, taskName);
        logExeca(taskName, await reloadPM2TaskByEcosystemFileInCurrentBuild(task));
    } catch (error) {
        console.error(error);
        logError(`Error while performing 'PM2 NodeJS HapiJS WebFuturistics common' flows for task '${taskName}': ${error.message}`, taskName);
    }

    // log end of the flow
    logInfo(`Ending 'PM2 NodeJS HapiJS WebFuturistics common' flows for task '${taskName}'`, taskName);
};

const pm2NodejsHapiJSWebFuturisticsCommon = (task, taskName) => {
    // prepare additional task configuration
    task.currentConfig.pm2EcosystemConfigFileLocation = defaultTo(`./app_server/${DEFAULT_PM2_ECOSYSTEM_CONFIG_FILE_NAME}`)(task.pm2EcosystemConfigFileLocation);

    // run common strategy
    runCommonStrategy(task, taskName, initTaskFlows);
};

// exports
module.exports.pm2NodejsHapiJSWebFuturisticsCommon = pm2NodejsHapiJSWebFuturisticsCommon;