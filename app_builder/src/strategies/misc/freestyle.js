'use strict';

// external imports

// local imports
const {logInfo, logError} = require('./../../helpers/logs');

const {executeSeriesOfFlows} = require('./../../helpers/flow');
const {runCommonStrategy} = require('./../../helpers/strategy');

// implementation
const initTaskFlows = async (task, taskName) => {
    // log start of the flow
    logInfo(`Starting 'Freestyle' flows for task '${taskName}'`);

    try {
        await executeSeriesOfFlows(task, taskName, task.currentConfig.tasks);
    } catch (error) {
        console.error(error);
        logError(`Error while performing 'Freestyle' flows for task '${taskName}': ${error.message}`);
    }

    // log end of the flow
    logInfo(`Ending 'Freestyle' flows for task '${taskName}'`);
};

const freestyle = (task, taskName) => {
    // run common strategy
    runCommonStrategy(task, taskName, initTaskFlows);
};

// exports
module.exports.freestyle = freestyle;
