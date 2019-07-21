'use strict';

// external imports

// local imports
const {logInfo, logError, logExeca} = require('./../../helpers/logs');

const {copyENVFile, makeBuildFromArchive} = require('./../../flows/common_builds');
const {generateLaravelKey, runLaravelMigrationsInCurrentBuild, runLaravelSeedsInCurrentBuild} = require('./../../flows/php/laravel');

const {runCommonStrategy} = require('./../../helpers/strategy');

// implementation
const initTaskFlows = async (task, taskName) => {
    // log start of the flow
    logInfo(`Starting 'Laravel PHP Simple' flows for task '${taskName}'`, taskName);

    try {
        logInfo(`Starting 'make build from archive' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await makeBuildFromArchive(task));

        logInfo(`Starting 'copy .env file' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await copyENVFile(task));

        logInfo(`Starting 'generate Laravel key' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await generateLaravelKey(task));

        logInfo(`Stating 'run Laravel migrations' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await runLaravelMigrationsInCurrentBuild(task));

        logInfo(`Stating 'run Laravel seeds' flow for task '${taskName}'`, taskName);
        logExeca(taskName, await runLaravelSeedsInCurrentBuild(task));
    } catch (error) {
        logError(`Error while performing 'Laravel PHP Simple' flows for task '${taskName}': ${error.message}`, taskName);
    }

    // log end of the flow
    logInfo(`Ending 'Laravel PHP Simple' flows for task '${taskName}'`, taskName);
};

const laravelPHPSimple = (task, taskName) => {
    // run common strategy
    runCommonStrategy(task, taskName, initTaskFlows);
};

// exports
module.exports = laravelPHPSimple;