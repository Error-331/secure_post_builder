'use strict';

// external imports
const {clone, mergeDeepRight} = require('ramda');

// local imports
const commonNodeJSBuilds = require('./common_nodejs_builds');

// implementation
async function stopPM2TaskByNameSilent(task, taskName, flowConfig) {
    let taskClone = clone(task);
    taskClone.currentConfig = mergeDeepRight(taskClone.currentConfig, flowConfig);

    return await commonNodeJSBuilds.stopPM2TaskByNameSilent(taskClone)
}

// exports
exports.stopPM2TaskByNameSilent = stopPM2TaskByNameSilent;