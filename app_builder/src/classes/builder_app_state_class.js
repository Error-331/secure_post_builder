'use strict';

// external imports
const EventEmitter = require('events');
const {reduce, mergeDeepRight} = require('ramda');

// local imports
const {extractTasksNames, setTaskJSONConfig, addMainConfigJsonWatcherTask} = require('./../helpers/tasks');

// implementation
class BuilderAppStateClass extends EventEmitter {
  constructor() {
    super(arguments);

    this.tasks = {};
  }

  addInternalTasks() {
    this.tasks = addMainConfigJsonWatcherTask(this.tasks);
  }

  setJsonTasks(jsonTasks) {
    const taskNames = extractTasksNames(jsonTasks);
    const newTasks = reduce((newTasks, taskName) => {
      const newTask = setTaskJSONConfig(this.tasks[taskName], jsonTasks[taskName]);
      newTasks[taskName] = newTask;

      return newTasks;
    }, {}, taskNames);

    this.tasks = mergeDeepRight(this.tasks, newTasks);
  }
}

// exports
module.exports = BuilderAppStateClass;