'use strict';

// external imports
const {flow} = require('mobx');
const execa = require('execa');

// local imports
const {
    getPathToCurrentBuild,
} = require('./../../helpers/common_builds');

// implementation
function * bootstrapLerna(task, taskName, flowConfig) {
    // get path to current build (where lerna.json is located)
    const cwd = getPathToCurrentBuild(task);

    // run npm task
    return yield execa('lerna', ['bootstrap'], {cwd});
}

// exports
exports.bootstrapLerna = flow(bootstrapLerna);