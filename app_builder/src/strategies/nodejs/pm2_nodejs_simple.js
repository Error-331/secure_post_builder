'use strict';

// external imports
const {isNil, equals, unless, ifElse, complement, defaultTo, curry} = require('ramda');
const {List} = require('immutable');
const debounce = require('lodash.debounce');

// local imports
const {TASK_INACTIVE_STATE} = require('./../../constants/tasks');
const {FILE_WATCH_DOG_TIMEOUT, ARCHIVE_WATCH_DEBOUNCE_WAIT} = require('./../../constants/strategies');

const {logInfo, logWarn, logError, logInotifyEvent, logExeca} = require('./../../helpers/logs');
const {isPathReadableSync} = require('./../../helpers/file_system');
const {isTaskStateBusy} = require('./../../helpers/tasks');
const {
    getTarArchiveCreatedInDirectoryMaxMasksInChain,
    addWatchDirectoryTarArchiveCreatedOrDeleted,

    isTarArchiveCreatedInDirectory,
    isFileDeletedInDirectory,
    isTarArchiveCreatedInDirectoryByMaskChain
} = require('./../../helpers/inotify');

const {addWatchDescriptorToTask, setTaskBusyState, setTaskInactiveState, setTaskErroneousState} = require('./../../actions/tasks');
const {makeBuildFromArchive} = require('./../../flows/common_builds');
const {stopPM2TaskByNameSilent, reloadPM2TaskByEcosystemFileInCurrentBuild} = require('./../../flows/nodejs/common_nodejs_builds');

// implementation
const WATCH_DIRECTORY_FROM_FOR_TAR_ARCHIVE_MOD_WATCHER_NAME = 'WATCH_DIRECTORY_FROM_FOR_TAR_ARCHIVE_MOD_WATCHER_NAME';

function resetTaskState(task, taskName) {
    logInfo(`Resetting state for task: '${taskName}'`);
    unless(isNil, clearTimeout)(task.watchDogTimeoutId);

    task.watchDogTimeoutId = null;
    task.storedMasks = List();
    task.onDirectoryFromTarArchiveChangeByMaskDebounce.cancel();
}

function initWatchDogTimer(task, taskName) {
    logInfo(`Initiating watch dog timer for task: '${taskName}'`);

    return setTimeout(() => {
        logInfo(`Watch dog launched for task: '${taskName}'`);
        resetTaskState(task, taskName);
    }, defaultTo(FILE_WATCH_DOG_TIMEOUT)(task.currentConfig.fileWatchDogTimeout))
}

const initTaskFlows = async (task, taskName) => {
    // log start of the flow
    logInfo(`Starting 'PM2 NodeJS Simple' flows for task '${taskName}'`);

    try {
        logInfo(`Starting 'stop PM2 task by name silent' flow for task '${taskName}'`);
        logExeca(taskName, await stopPM2TaskByNameSilent(task));

        logInfo(`Starting 'make build from archive' flow for task '${taskName}'`);
        logExeca(taskName, await makeBuildFromArchive(task));

        logInfo(`Starting 'reload PM2 task by ecosystem file in current build' flows for task '${taskName}'`);
        logExeca(taskName, await reloadPM2TaskByEcosystemFileInCurrentBuild(task));
    } catch (error) {
        console.error(error);
        logError(`Error while performing 'PM2 NodeJS Simple' flows for task '${taskName}': ${error.message}`);
    }

    // log end of the flow
    logInfo(`Ending 'PM2 NodeJS Simple' flows for task '${taskName}'`);
};

async function onDirectoryFromTarArchiveChangeByMask(flowFunction, task, taskName, watchName, event) {
    if (!isTarArchiveCreatedInDirectoryByMaskChain(task.storedMasks.toArray())) {
        // reset task state
        return resetTaskState(task, taskName);
    }

    // set task state as busy
    setTaskBusyState(taskName);

    // reset task state
    resetTaskState(task, taskName);

    // start flow function
    await flowFunction(task, taskName);

    // set task state as inactive
    setTaskInactiveState(taskName);
}

async function onDirectoryFromTarArchiveChange(task, taskName, watchName, event) {
    const {archiveFileNameToWatch} = task.currentConfig;
    const maxMasksInChain = getTarArchiveCreatedInDirectoryMaxMasksInChain();

    if (isTarArchiveCreatedInDirectory(archiveFileNameToWatch, event)) {

        if (isTaskStateBusy(task)) {
            return;
        }

        logInotifyEvent(taskName, watchName, event);

        if (task.storedMasks.size === 0 && complement(isNil)(task.watchDogTimeoutId)) {
            task.watchDogTimeoutId = initWatchDogTimer(task, taskName);
        }

        if (task.storedMasks.size >= maxMasksInChain) {
            task.storedMasks = task.storedMasks.shift();
        }

        task.storedMasks = task.storedMasks.push(event.mask);
        task.onDirectoryFromTarArchiveChangeByMaskDebounce(task, taskName, watchName, event);

        return true;
    }

    if (isFileDeletedInDirectory(archiveFileNameToWatch, event)) {
        logInotifyEvent(taskName, watchName, event);
        return resetTaskState(task, taskName);
    }
}

const pm2NodejsSimple = (task, taskName) => {
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
module.exports.resetTaskState = resetTaskState;
module.exports.initWatchDogTimer = initWatchDogTimer;
module.exports.initTaskFlows = initTaskFlows;
module.exports.onDirectoryFromTarArchiveChangeByMask = onDirectoryFromTarArchiveChangeByMask;
module.exports.onDirectoryFromTarArchiveChange = onDirectoryFromTarArchiveChange;
module.exports.pm2NodejsSimple = pm2NodejsSimple;