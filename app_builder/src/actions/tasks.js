'use strict';

// external imports
const {action} = require('mobx');
const {unless, isNil, equals, curry, keysIn, forEach, omit, mergeDeepRight, values} = require('ramda');

// local imports
const store = require('./../store');
const {
  TASK_INACTIVE_STATE,
  TASK_BUSY_STATE,
  TASK_WATCHING_STATE,
  TASK_ERROR_STATE
} = require('./../constants/tasks');

const {
  reloadJSONTasks,
  extractTasksNames,
  extractSkippedTasksNames,
  removeTasks,
  mergeTasksCreateIfNotExist,
  addMainConfigJsonWatcherTask
} = require('./../helpers/tasks');

const {logInfo, logWarn, logError} = require('./../helpers/logs');
const {removeWatchers, removeWatcher} = require('./../helpers/inotify');
const {taskStrategyPatternFactory} = require('./../strategies/task_strategies');

// implementation
function reloadJSONTasksAction() {
  logInfo('Loading JSON tasks...');

  let jsonTasks;
  try {
    jsonTasks = reloadJSONTasks();
  } catch (error) {
    logError(`Error while loading JSON tasks: ${error.message}`);
    return;
  }

  // TODO: check tasks json here

  const skippedTasksNames = extractSkippedTasksNames(jsonTasks.tasks);
  unless(equals(0), () => logWarn(`Found JSON tasks which uses reserved names(skipping): ${skippedTasksNames}`))(skippedTasksNames.length);

  jsonTasks.tasks = removeTasks(jsonTasks.tasks, skippedTasksNames);

  let newTasks = mergeTasksCreateIfNotExist(store.tasks, jsonTasks.tasks);
  logInfo('JSON tasks loaded...');

  logInfo('Adding internal tasks...');
  newTasks = addMainConfigJsonWatcherTask(newTasks);
  logInfo('Internal tasks added...');

  store.tasks = newTasks;
}

function updateTaskConfig(taskName) {
  store.tasks[taskName].currentConfig = store.tasks[taskName].newConfig;
  store.tasks[taskName].newConfig = {};

  logInfo(`Configuration for task '${taskName}' has been updated`);

  const taskStrategy = taskStrategyPatternFactory(store.tasks[taskName].currentConfig.strategy);
  unless(isNil, taskStrategy => taskStrategy(store.tasks[taskName], taskName))(taskStrategy);
}

function updateTasksConfig(tasksNames) {
  if (isNil(tasksNames)) {
    return;
  }

  logInfo(`Updating tasks (${tasksNames}) configurations...`);
  forEach(updateTaskConfig, tasksNames);
  logInfo(`Tasks (${tasksNames}) configurations updated...`);
}

function removeTaskWatchDescriptor(taskName, watchDescriptorName) {
  logInfo(`Removing watch descriptor(${watchDescriptorName}) for task '${taskName}'...`);
  removeWatcher(store.tasks[taskName].watchDescriptors[watchDescriptorName]);
  store.tasks[taskName].watchDescriptors = omit([watchDescriptorName], store.tasks[taskName].watchDescriptors);
  logInfo(`Watch descriptor(${watchDescriptorName}) removed from task '${taskName}'...`);
}

function clearTaskWatchDescriptors(taskName) {
  logInfo(`Clearing watch descriptors(${keysIn(store.tasks[taskName].watchDescriptors)}) for task '${taskName}'...`);
  removeWatchers(values(store.tasks[taskName].watchDescriptors));
  store.tasks[taskName].watchDescriptors = {};
  logInfo(`Watch descriptors cleaned for task '${taskName}'...`);
}

function clearAllTasksWatchDescriptors() {
  logInfo('Cleaning watch descriptors of all tasks...');
  forEach((taskName) => {
    clearTaskWatchDescriptors(taskName);
  }, extractTasksNames(store.tasks));
  logInfo('Watch descriptors cleaned for all tasks...');
}

function addWatchDescriptorToTask(taskName, watchDescriptorName, watchDescriptorValue) {
  logInfo(`Adding watch descriptor (${watchDescriptorName}) to task '${taskName}'...`);
  store.tasks[taskName].watchDescriptors = mergeDeepRight(store.tasks[taskName].watchDescriptors, {[watchDescriptorName]: watchDescriptorValue});
  logInfo(`Watch descriptor added to task '${taskName}'...`);
}

function addWatchDescriptorsToTask(taskName, watchDescriptors) {
  logInfo(`Adding watch descriptors (${keysIn(watchDescriptors)}) to task '${taskName}'...`);
  store.tasks[taskName].watchDescriptors = mergeDeepRight(store.tasks[taskName].watchDescriptors, watchDescriptors);
  logInfo(`Watch descriptors added to task '${taskName}'...`);
}

function setTaskState(newState, taskName) {
  logInfo(`Changing state for task '${taskName}' to ${newState}`);
  store.tasks[taskName].state = newState;
}

// exports
exports.reloadJSONTasksAction = action(reloadJSONTasksAction);

exports.updateTaskConfig = action(curry(updateTaskConfig));
exports.updateTasksConfig = action(curry(updateTasksConfig));

exports.removeTaskWatchDescriptor = action(curry(removeTaskWatchDescriptor));
exports.clearTaskWatchDescriptors = action(curry(clearTaskWatchDescriptors));
exports.clearAllTasksWatchDescriptors = action(clearAllTasksWatchDescriptors);

exports.addWatchDescriptorToTask = action(curry(addWatchDescriptorToTask));
exports.addWatchDescriptorsToTask = action(curry(addWatchDescriptorsToTask));

exports.setTaskState = setTaskState;
exports.setTaskInactiveState = action(curry(setTaskState)(TASK_INACTIVE_STATE));
exports.setTaskBusyState = action(curry(setTaskState)(TASK_BUSY_STATE));
exports.setTaskWatchingState = action(curry(setTaskState)(TASK_WATCHING_STATE));
exports.setTaskErroneousState = action(curry(setTaskState)(TASK_ERROR_STATE));