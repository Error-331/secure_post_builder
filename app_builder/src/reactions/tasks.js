'use strict';

// external imports
const {reaction} = require('mobx');
const {__, unless, always, complement, compose, equals, gt, reduce, length} = require('ramda');

// local imports
const {extractTasksNames} = require('./../helpers/tasks');
const store = require('./../store');
const {updateTasksConfig} = require('./../actions/tasks');
const {TASK_BUSY_STATE} = require('./../constants/tasks');

// implementation
reaction(() => {
  const taskNames = extractTasksNames(store.tasks);

  const modifiedTasks = reduce((notBustTasksNamesAwaitingNewConfig, taskName) => {
    const task = store.tasks[taskName];

    if (complement(equals)({}, task.newConfig) && task.state !== TASK_BUSY_STATE) {
      notBustTasksNamesAwaitingNewConfig.push(taskName);
    }

    return notBustTasksNamesAwaitingNewConfig;
  }, [], taskNames);

  return unless(compose(gt(__, 0), length), always(undefined))(modifiedTasks);
}, notBustTasksNamesAwaitingNewConfig => updateTasksConfig(notBustTasksNamesAwaitingNewConfig));

// exports