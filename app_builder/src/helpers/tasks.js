'use strict';

// external imports
const {unless, isNil, equals, defaultTo, keysIn, pathEq, pickBy, intersection, curry, omit, clone, concat, reduce, mergeDeepRight} = require('ramda');
const {List} = require('immutable');

// local imports
const {logInfo} = require('./logs');

const {
    PATH_TO_TASKS_JSON,
    RESTRICTED_TASKS_NAMES,
    TASK_TEMPLATE,

    TASK_BUSY_STATE,

    MAIN_CONFIG_JSON_WATCHER_TASK_NAME,
    MAIN_CONFIG_JSON_WATCHER_STRATEGY,
    MAIN_CONFIG_JSON_WATCHER_TASK_CONFIG_TEMPLATE
} = require('./../constants/tasks');

// implementation

// throws error
function reloadJSONTasks() {
    unless(isNil, () => delete require.cache[PATH_TO_TASKS_JSON])(require.cache[PATH_TO_TASKS_JSON]);
    return require(PATH_TO_TASKS_JSON);
}

function resetTaskArchiveWatchState(task, taskName) {
    logInfo(`Resetting state for task: '${taskName}'`);
    unless(isNil, clearTimeout)(task.watchDogTimeoutId);

    task.watchDogTimeoutId = null;
    task.storedMasks = List();
    task.onDirectoryFromTarArchiveChangeByMaskDebounce.cancel();
}

function extractTasksNames(tasks) {
    return keysIn(tasks);
}

function extractSkippedTasksNames(tasks) {
    const skippedTasksByName = intersection(RESTRICTED_TASKS_NAMES, extractTasksNames(tasks));
    const skippedTasksByStrategy = extractTasksNames(pickBy(pathEq(['strategy'], MAIN_CONFIG_JSON_WATCHER_STRATEGY), tasks));

    return concat(skippedTasksByName, skippedTasksByStrategy);
}

function removeTasks(tasks, tasksToRemove = []) {
    return omit(tasksToRemove, tasks);
}

function addTask(tasks, taskName, taskConfig) {
    return unless(tasks => !isNil(tasks[taskName]), () => {
        const newTasks = clone(tasks);

        newTasks[taskName] = getTask();
        newTasks[taskName].newConfig = clone(taskConfig);

        return newTasks
    })(tasks);
}

function addMainConfigJsonWatcherTask(tasks) {
    return addTask(tasks, MAIN_CONFIG_JSON_WATCHER_TASK_NAME, MAIN_CONFIG_JSON_WATCHER_TASK_CONFIG_TEMPLATE);
}

function isTaskState(state, task) {
    return  getTaskState(task) === state;
}

function getTaskTemplate() {
    return clone(TASK_TEMPLATE);
}

function getTask(task) {
    return defaultTo(getTaskTemplate())(task);
}

function getTaskState(task) {
    return getTask(task).state;
}

function setTaskJSONConfig(task, jsonConfig) {
    task = getTask(task);

    if (isNil(jsonConfig)) {
        return task;
    }

    task = unless(equals(task.currentConfig), (taskConfig) => {
        const newTask = clone(task);
        newTask.newConfig = clone(taskConfig);

        return newTask;
    })(jsonConfig);

    return task;
}

function mergeTasksCreateIfNotExist(tasks, jsonTasks) {
    const taskNames = extractTasksNames(jsonTasks);
    const newTasks = reduce((newTasks, taskName) => {
        newTasks[taskName] = setTaskJSONConfig(tasks[taskName], jsonTasks[taskName]);
        return newTasks;
    }, {}, taskNames);

    return mergeDeepRight(tasks, newTasks);
}

// exports
exports.reloadJSONTasks = reloadJSONTasks;
exports.resetTaskArchiveWatchState = resetTaskArchiveWatchState;

exports.extractTasksNames = extractTasksNames;
exports.extractSkippedTasksNames = extractSkippedTasksNames;

exports.removeTasks = removeTasks;
exports.addTask = addTask;
exports.addMainConfigJsonWatcherTask = addMainConfigJsonWatcherTask;

exports.isTaskState = isTaskState;
exports.isTaskStateBusy = curry(isTaskState)(TASK_BUSY_STATE);

exports.getTaskTemplate = getTaskTemplate;
exports.getTask = getTask;
exports.getTaskState = getTaskState;

exports.setTaskJSONConfig = setTaskJSONConfig;
exports.mergeTasksCreateIfNotExist = mergeTasksCreateIfNotExist;