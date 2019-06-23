'use strict';

// external imports
const {resolve} = require('path');
const {F, defaultTo, tryCatch, equals, ifElse, curry} = require('ramda');
const {List} = require('immutable');
const debounce = require('lodash.debounce');

// local imports
const {OLD_BUILD_DIRECTORY_NAME} = require('./../constants/common_builds');

const {logInfo, logWarn} = require('./logs');
const {isPathReadableSync} = require('./file_system');
const {getPathToCurrentBuild} = require('./common_builds');
const {addWatchDirectoryTarArchiveCreatedOrDeleted} = require('./inotify');
const {resetTaskArchiveWatchState} = require('./tasks');

const {onDirectoryFromTarArchiveChange, onDirectoryFromTarArchiveChangeByMask} = require('./../handlers/directory_change');
const {addWatchDescriptorToTask, setTaskErroneousState} = require('./../actions/tasks');

const {TASK_INACTIVE_STATE} = require('./../constants/tasks');
const {ARCHIVE_WATCH_DEBOUNCE_WAIT, FILE_WATCH_DOG_TIMEOUT} = require('./../constants/strategies');
const {WATCH_DIRECTORY_FROM_FOR_TAR_ARCHIVE_MOD_WATCHER_NAME} = require('./../constants/watchers');

// implementation
function isArchiveFileExistsInSourceDir(task) {
    const pathToWatchedFile = getPathToSourceArchiveFile(task);
    return tryCatch(isPathReadableSync, F)(pathToWatchedFile);
}

function isOldBuildDirExistInDestinationDir(task) {
    const pathToOldCurrentBuildDir = getPathToDestinationOldBuildDir(task);
    return tryCatch(isPathReadableSync, F)(pathToOldCurrentBuildDir);
}

function isCurrentBuildDirExistInDestinationDir(task) {
    const pathToDestinationCurrentBuildDir = getPathToCurrentBuild(task);
    return tryCatch(isPathReadableSync, F)(pathToDestinationCurrentBuildDir);
}

function initWatchDogTimer(task, taskName) {
    logInfo(`Initiating watch dog timer for task: '${taskName}'`);

    return setTimeout(() => {
        logInfo(`Watch dog launched for task: '${taskName}'`);
        resetTaskArchiveWatchState(task, taskName);
    }, defaultTo(FILE_WATCH_DOG_TIMEOUT)(task.currentConfig.fileWatchDogTimeout))
}

function runCommonStrategy(task, taskName, flowFunction) {
    // prepare additional state for task
    task.watchDogTimeoutId = null;
    task.storedMasks = List();

    // curry from tar archive change function
    const onDirectoryFromTarArchiveChangeByMaskCurried = curry(onDirectoryFromTarArchiveChangeByMask)(flowFunction);

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
}

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

// exports
exports.isArchiveFileExistsInSourceDir = isArchiveFileExistsInSourceDir;
exports.isOldBuildDirExistInDestinationDir = isOldBuildDirExistInDestinationDir;
exports.isCurrentBuildDirExistInDestinationDir = isCurrentBuildDirExistInDestinationDir;

exports.initWatchDogTimer = initWatchDogTimer;
exports.runCommonStrategy = runCommonStrategy;

exports.getPathToSourceArchiveFile = getPathToSourceArchiveFile;
exports.getPathToDestinationArchiveFile = getPathToDestinationArchiveFile;
exports.getPathToDestinationOldBuildDir = getPathToDestinationOldBuildDir;