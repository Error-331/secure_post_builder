'use strict';

// external imports
const {resolve} = require('path');
const {flow} = require('mobx');

const execa = require('execa');

// local imports
const {CURRENT_BUILD_DIRECTORY_NAME,} = require('./../constants/common_builds');

// implementation
function * runLaravelMigrationsInCurrentBuild(task) {
    const {pathToDistFolder} = task.currentConfig;
    const cwd = resolve(pathToDistFolder, CURRENT_BUILD_DIRECTORY_NAME);

    // start pm2 tasks using ecosystem config file
    return yield execa('php', ['artisan', 'migrate'], {cwd});
}

// exports
exports.runLaravelMigrationsInCurrentBuild = flow(runLaravelMigrationsInCurrentBuild);
