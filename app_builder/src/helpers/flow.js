'use strict';

// external imports
const {isNil, unless} = require('ramda');

// local imports
const {logInfo, logExeca} = require('./logs');

const {copyFileFromDistToBuild, deleteFileInCurrentBuild, makeBuildFromArchive} = require('./../flows/common_builds');
const {bootstrapLerna} = require('./../flows/nodejs/lerna_builds');

const {installNPMPackages, runNPMTaskInSubDir} = require('./../flows/nodejs/common_nodejs_builds');
const {stopPM2TaskByNameSilent} = require('./../flows/nodejs/common_nodejs_builds_freestyle_adapters');

// implementation

// throws error
function findFlowByName(flowName) {
    switch(flowName) {
        case 'copyFileFromDistToBuild':
            return copyFileFromDistToBuild;
        case 'deleteFileInCurrentBuild':
            return deleteFileInCurrentBuild;
        case 'makeBuildFromArchive':
            return makeBuildFromArchive;
        case 'installNPMPackages':
            return installNPMPackages;
        case 'runNPMTaskInSubDir':
            return runNPMTaskInSubDir;
        case 'stopPM2TaskSilent':
            return stopPM2TaskByNameSilent;
        case 'bootstrapLerna':
            return bootstrapLerna;
        default:
            throw new Error(`Cannot find flow named: '${flowName}'`);
    }
}

async function executeFlow(task, taskName, flowConfig) {
    const {name, description} = flowConfig;
    const flowFunction = findFlowByName(name);

    unless(isNil, (desc) => logInfo(`${desc} - '${taskName}'`, taskName))(description);
    return await flowFunction(task, taskName, flowConfig);
}

async function executeSeriesOfFlows(task, taskName, flows) {
    for (let flowCounter = 0; flowCounter < flows.length; flowCounter++) {
        logExeca(
            taskName,
            await executeFlow(task, taskName, flows[flowCounter])
        );
    }
}


// exports
exports.findFlowFunctionByName = findFlowByName;
exports.executeSeriesOfFlows = executeSeriesOfFlows;