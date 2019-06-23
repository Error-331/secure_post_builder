'use strict';

// external imports
const {equals, ifElse, defaultTo, curry} = require('ramda');
const {List} = require('immutable');
const debounce = require('lodash.debounce');

// local imports
const {TASK_INACTIVE_STATE} = require('./../../constants/tasks');
const {ARCHIVE_WATCH_DEBOUNCE_WAIT} = require('./../../constants/strategies');
const {DEFAULT_PM2_ECOSYSTEM_CONFIG_FILE_NAME} = require('./../../constants/nodejs');

const {logInfo, logWarn, logError, logExeca} = require('./../../helpers/logs');
const {isPathReadableSync} = require('./../../helpers/file_system');
const {
    addWatchDirectoryTarArchiveCreatedOrDeleted,
} = require('./../../helpers/inotify');
const {
    getPathToFileInDistFolder,
    getPathToFileInCurrentLernaBuild,
} = require('./../../helpers/common_builds');

const {addWatchDescriptorToTask, setTaskErroneousState} = require('./../../actions/tasks');
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

const {onDirectoryFromTarArchiveChangeByMask, onDirectoryFromTarArchiveChange} = require('./pm2_nodejs_simple');

const {runCommonStrategy} = require('./../../helpers/strategy');

// implementation
const initTaskFlows = async (task, taskName) => {
    // log start of the flow
    logInfo(`Starting 'PM2 NodeJS HapiJS WebFuturistics lerna' flows for task '${taskName}'`);

    try {
        logInfo(`Starting 'stop PM2 task by name silent' flow for task '${taskName}'`);
        logExeca(taskName, await stopPM2TaskByNameSilent(task));

        logInfo(`Deleting linux socket file' flow for task '${taskName}'`);
        logExeca(taskName, await deleteFileForce(
            task,
            getPathToFileInCurrentLernaBuild(task, task.currentConfig.linuxSocketPath)
        ));

        logInfo(`Starting 'make build from archive' flow for task '${taskName}'`);
        logExeca(taskName, await makeBuildFromArchive(task));

        logInfo(`Starting 'copy server specific config file' flow for task '${taskName}'`);
        logExeca(taskName, await copyFile(
            task,
            getPathToFileInDistFolder(task, 'server_specific_config.json'),
            getPathToFileInCurrentLernaBuild(task, 'app_server/configs')
        ));

        logInfo(`Starting 'copy frontend config file' flow for task '${taskName}'`);
        logExeca(taskName, await copyFile(
            task,
            getPathToFileInDistFolder(task, 'frontend_config.json'),
            getPathToFileInCurrentLernaBuild(task, 'app_front')
        ));

        logInfo(`Starting 'run NPM task' flow for task '${taskName}'`);
        logExeca(taskName, await runNPMTask(task, 'build-frontend-production'));

        logInfo(`Starting 'reload PM2 task by ecosystem file in current build' flows for task '${taskName}'`);
        logExeca(taskName, await reloadPM2TaskByEcosystemFileInCurrentBuild(task));
    } catch (error) {
        console.error(error);
        logError(`Error while performing 'PM2 NodeJS HapiJS WebFuturistics lerna' flows for task '${taskName}': ${error.message}`);
    }

    // log end of the flow
    logInfo(`Ending 'PM2 NodeJS HapiJS WebFuturistics lerna' flows for task '${taskName}'`);
};

const pm2NodejsHapiJSWebFuturisticsLerna = (task, taskName) => {
    // prepare additional task configuration
    task.currentConfig.pm2EcosystemConfigFileLocation = defaultTo(`./app_server/${DEFAULT_PM2_ECOSYSTEM_CONFIG_FILE_NAME}`)(task.pm2EcosystemConfigFileLocation);

    // run common strategy
    runCommonStrategy(task, taskName, initTaskFlows);
};

// exports
module.exports.pm2NodejsHapiJSWebFuturisticsLerna = pm2NodejsHapiJSWebFuturisticsLerna;