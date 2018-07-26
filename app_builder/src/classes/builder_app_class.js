'use strict';

// external imports
const {unless, equals} = require('ramda');

// local imports
const BuilderAppStateClass = require('./builder_app_state_class');

const {createDefaultLogger} = require('./../helpers/logs');
const {reloadJSONTasks, extractSkippedTasksNames, removeTasks} = require('./../helpers/tasks');

// implementation
class BuilderAppClass {
  constructor() {
    this.logger = null;
    this.state = new BuilderAppStateClass();
  }

  initTasks() {
    this.logger.log({level: 'info', message: 'Initiating tasks...'});

    this.state.addInternalTasks();

    this.logger.log({level: 'info', message: 'Tasks initiated...'});
  }

  initLogger() {
    this.logger = createDefaultLogger();
    this.logger.log({level: 'info', message: 'Logger initiated...'});
  }

  loadTasksConfiguration() {
    this.logger.log({level: 'info', message: 'Loading JSON tasks...'});

    let jsonTasks;
    try {
      jsonTasks = reloadJSONTasks();
    } catch (error) {
      this.logger.log({level: 'error', message: `Error while loading JSON tasks: ${error.message}`});
      return;
    }

    // TODO: check tasks json here

    const skippedTasksNames = extractSkippedTasksNames(jsonTasks.tasks);
    unless(equals(0), () => this.logger.log({level: 'warn', message: `Found JSON tasks which uses reserved names(skipping): ${skippedTasksNames}`}))(skippedTasksNames.length);

    jsonTasks.tasks = removeTasks(jsonTasks.tasks, skippedTasksNames);

    this.state.setJsonTasks(jsonTasks.tasks);
    this.logger.log({level: 'info', message: 'JSON tasks loaded...'});

    this.logger.log({level: 'info', message: 'Adding internal tasks...'});
    this.state.addInternalTasks();
    this.logger.log({level: 'info', message: 'Internal tasks added...'});
  }



  init() {
    this.initLogger();
    this.loadTasksConfiguration();
    this.initTasks();


  }
}

// exports
module.exports = BuilderAppClass;