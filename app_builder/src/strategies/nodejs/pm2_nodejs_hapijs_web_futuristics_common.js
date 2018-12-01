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
    getPathToFileInCurrentBuild
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

// implementation
const WATCH_DIRECTORY_FROM_FOR_TAR_ARCHIVE_MOD_WATCHER_NAME = 'WATCH_DIRECTORY_FROM_FOR_TAR_ARCHIVE_MOD_WATCHER_NAME';

const initTaskFlows = async (task, taskName) => {
    // log start of the flow
    logInfo(`Starting 'PM2 NodeJS Simple' flows for task '${taskName}'`);

    try {
        logInfo(`Starting 'stop PM2 task by name silent' flow for task '${taskName}'`);
        logExeca(taskName, await stopPM2TaskByNameSilent(task));

        logInfo(`Deleting linux socket file' flow for task '${taskName}'`);
        logExeca(taskName, await deleteFileForce(task, task.currentConfig.linuxSocketPath));

        logInfo(`Starting 'make build from archive' flow for task '${taskName}'`);
        logExeca(taskName, await makeBuildFromArchive(task));

        logInfo(`Starting 'copy server specific config file' flow for task '${taskName}'`);
        logExeca(taskName, await copyFile(
            task,
            getPathToFileInDistFolder(task, 'server_specific_config.json'),
            getPathToFileInCurrentBuild(task, 'app_server/configs')
            ));

        logInfo(`Starting 'copy frontend config file' flow for task '${taskName}'`);
        logExeca(taskName, await copyFile(
            task,
            getPathToFileInDistFolder(task, 'frontend_config.json'),
            getPathToFileInCurrentBuild(task, 'app_front')
        ));

        logInfo(`Starting 'run NPM task' flow for task '${taskName}'`);
        logExeca(taskName, await runNPMTask(task, 'build-frontend-production'));

        logInfo(`Starting 'reload PM2 task by ecosystem file in current build' flows for task '${taskName}'`);
        logExeca(taskName, await reloadPM2TaskByEcosystemFileInCurrentBuild(task));
    } catch (error) {
        console.error(error);
        logError(`Error while performing 'PM2 NodeJS Simple' flows for task '${taskName}': ${error.message}`);
    }

    // log end of the flow
    logInfo(`Ending 'PM2 NodeJS Simple' flows for task '${taskName}'`);
};

const pm2NodejsHapijsWebFuturisticsCommon = (task, taskName) => {
    // prepare additional task configuration
    task.currentConfig.pm2EcosystemConfigFileLocation = defaultTo(`./app_server/${DEFAULT_PM2_ECOSYSTEM_CONFIG_FILE_NAME}`)(task.pm2EcosystemConfigFileLocation);

    // prepare additional state for task
    task.watchDogTimeoutId = null;
    task.storedMasks = List();

    // curry from tar archive change function
    const onDirectoryFromTarArchiveChangeByMaskCurried = curry(onDirectoryFromTarArchiveChangeByMask)(initTaskFlows);

    // prepare debounced archive watch handler
    const {archiveWatchDebounceWait} = task.currentConfig;
    task.onDirectoryFromTarArchiveChangeByMaskDebounce = debounce(
        onDirectoryFromTarArchiveChangeByMaskCurried,
        defaultTo(ARCHIVE_WATCH_DEBOUNCE_WAIT)(archiveWatchDebounceWait)
    );

    // prepare directory change event function
    let onDirectoryFromTarArchiveChangeLocal = curry(onDirectoryFromTarArchiveChange)(task, taskName, WATCH_DIRECTORY_FROM_FOR_TAR_ARCHIVE_MOD_WATCHER_NAME);

    // write appropriate log message regarding task launch
    ifElse(
        equals(TASK_INACTIVE_STATE),
        () => logWarn(`Starting task: '${taskName}'`),
        () => logWarn(`Restarting task: '${taskName}'`)
    )(task.state);

    // get necessary file system entities (path to directories/files) from configuration object
    const {pathToSourceFolder, pathToDistFolder} = task.currentConfig;

    // check file system entities
    let isFSEntitiesAccessible = false;
    try {
        isFSEntitiesAccessible = isPathReadableSync(pathToSourceFolder) && isPathReadableSync(pathToDistFolder);
    } catch(error) {
        logError(`Error while checking FS entities for task '${taskName}': ${error.message}`);
        return setTaskErroneousState(taskName);
    }

    // if file system entities check fails, set erroneous state for current task
    if (equals(isFSEntitiesAccessible, false)) {
        return setTaskErroneousState(taskName);
    }

    // add watcher for source directory for archive file modification
    const archiveFileWatchDescriptor = addWatchDirectoryTarArchiveCreatedOrDeleted(pathToSourceFolder, onDirectoryFromTarArchiveChangeLocal);
    addWatchDescriptorToTask(taskName, WATCH_DIRECTORY_FROM_FOR_TAR_ARCHIVE_MOD_WATCHER_NAME, archiveFileWatchDescriptor);
};

// exports
module.exports.pm2NodejsHapijsWebFuturisticsCommon = pm2NodejsHapijsWebFuturisticsCommon;