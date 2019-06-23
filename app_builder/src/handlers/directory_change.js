'use strict';

// external imports
import {complement} from 'ramda';

// local imports
const {isTaskStateBusy, resetTaskArchiveWatchState, setTaskBusyState, setTaskInactiveState,} = require('./../helpers/tasks');
const {logInotifyEvent} = require('./../helpers/logs');
const {initWatchDogTimer} = require('./../helpers/strategy');
const {
    getTarArchiveCreatedInDirectoryMaxMasksInChain,

    isTarArchiveCreatedInDirectory,
    isFileDeletedInDirectory,
    isTarArchiveCreatedInDirectoryByMaskChain,
} = require('./../helpers/inotify');

// implementation
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
        return resetTaskArchiveWatchState(task, taskName);
    }
}

async function onDirectoryFromTarArchiveChangeByMask(flowFunction, task, taskName, watchName, event) {
    if (!isTarArchiveCreatedInDirectoryByMaskChain(task.storedMasks.toArray())) {
        // reset task state
        return resetTaskArchiveWatchState(task, taskName);
    }

    // set task state as busy
    setTaskBusyState(taskName);

    // reset task state
    resetTaskArchiveWatchState(task, taskName);

    // start flow function
    await flowFunction(task, taskName);

    // set task state as inactive
    setTaskInactiveState(taskName);
}

// exports
exports.onDirectoryFromTarArchiveChange = onDirectoryFromTarArchiveChange;
exports.onDirectoryFromTarArchiveChangeByMask = onDirectoryFromTarArchiveChangeByMask;