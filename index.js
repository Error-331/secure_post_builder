'use strict';

// external imports
// local imports
const {getDefaultLogger} = require('./app_builder/src/helpers/logs');
const {reloadJSONTasksAction, clearAllTasksWatchDescriptors} = require('./app_builder/src/actions/tasks');

require('./app_builder/src/reactions');

// implementation
function onNodeExit() {
    const logger = getDefaultLogger();
    logger.log({level: 'info', message: 'Exiting...'});

    clearAllTasksWatchDescriptors()
}

process.on('exit', onNodeExit);
process.on('SIGINT', () => {
    process.exit('SIGINT');
});

const logger = getDefaultLogger();
logger.log({level: 'info', message: 'Logger initiated...'});

reloadJSONTasksAction();