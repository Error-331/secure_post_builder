'use strict';

// external imports
const {flow} = require('mobx');
const execa = require('execa');
const {defaultTo} = require('ramda')

// local imports
const {
    getPathToCurrentBuild,
} = require('./../../helpers/common_builds');

// implementation
function * bootstrapLerna(task, taskName, flowConfig) {
    // get path to current build (where lerna.json is located)
    const cwd = getPathToCurrentBuild(task);

    // prepare other parameters
    let {env} = task;
    env = defaultTo({})(env);

    // run npm task
    return yield execa('lerna', ['bootstrap'], {cwd, env});
}

// exports
exports.bootstrapLerna = flow(bootstrapLerna);