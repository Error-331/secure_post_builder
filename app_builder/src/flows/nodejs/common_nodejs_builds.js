'use strict';

// external imports
const {flow} = require('mobx');
const {defaultTo} = require('ramda');

const execa = require('execa');

// local imports
const {
    DEFAULT_PM2_ECOSYSTEM_CONFIG_FILE_NAME
} = require('./../../constants/nodejs');

const {
    getPathToCurrentBuild,
    getPathToDirectoryInCurrentBuild,
} = require('./../../helpers/common_builds');

// implementation
function * runNPMTask(task, npmTaskName) {
    // get path to current build (where package.json is located)
    const cwd = getPathToCurrentBuild(task);

    // run npm task
    return yield execa('npm', ['run', npmTaskName], {cwd});
}

function * runNPMTaskInSubDir(task, taskName, flowConfig) {
    // get path to directory in current build
    const cwd = getPathToDirectoryInCurrentBuild(task, flowConfig.path);

    // run npm task
    return yield execa('npm', ['run', flowConfig.npmTaskName], {cwd});
}

function * stopPM2TaskByName(task) {
    // get pm2 task name
    const {pm2TaskName} = task.currentConfig;

    // stop pm2 task
    return yield execa('pm2', ['stop', pm2TaskName]);
}

function * stopPM2TaskByNameSilent(task) {
    // get pm2 task name
    const {pm2TaskName} = task.currentConfig;

    try {
        return yield execa('pm2', ['stop', pm2TaskName, '-s']);
    } catch(error) {
        return error;
    }
}

function * startPM2TaskByName(task) {
    // get pm2 task name
    const {pm2TaskName} = task.currentConfig;

    // start pm2 task
    return yield execa('pm2', ['start', pm2TaskName]);
}

function * startPM2TaskByEcosystemFile(task, cwd) {
    // get path to destination folder and path to pm2 ecosystem config file
    const {pm2EcosystemConfigFileLocation} = task.currentConfig;
    const pathToEcosystemFile = defaultTo(`./${DEFAULT_PM2_ECOSYSTEM_CONFIG_FILE_NAME}`)(pm2EcosystemConfigFileLocation);

    // start pm2 tasks using ecosystem config file
    return yield execa('pm2', ['start', pathToEcosystemFile], {cwd});
}

function * startPM2TaskByEcosystemFileInCurrentBuild(task) {
    const cwd = getPathToCurrentBuild(task);
    return yield * startPM2TaskByEcosystemFile(task, cwd)
}

function * reloadPM2TaskByEcosystemFile(task, cwd) {
    // get path to destination folder and path to pm2 ecosystem config file
    let {pm2EcosystemConfigFileLocation, pm2Options} = task.currentConfig;
    pm2EcosystemConfigFileLocation = defaultTo(`./${DEFAULT_PM2_ECOSYSTEM_CONFIG_FILE_NAME}`)(pm2EcosystemConfigFileLocation);

    // concat user options and main options
    pm2Options = defaultTo('')(pm2Options).split(' ');
    pm2Options = ['reload', pm2EcosystemConfigFileLocation].concat(pm2Options);

    // start pm2 tasks using ecosystem config file
    return yield execa('pm2', pm2Options, {cwd});
}

function * reloadPM2TaskByEcosystemFileInCurrentBuild(task) {
    const cwd = getPathToCurrentBuild(task);
    return yield * reloadPM2TaskByEcosystemFile(task, cwd)
}

// exports
exports.runNPMTask = flow(runNPMTask);
exports.runNPMTaskInSubDir = flow(runNPMTaskInSubDir);

exports.stopPM2TaskByName = flow(stopPM2TaskByName);
exports.stopPM2TaskByNameSilent = flow(stopPM2TaskByNameSilent);

exports.startPM2TaskByName = flow(startPM2TaskByName);
exports.startPM2TaskByEcosystemFile = flow(startPM2TaskByEcosystemFile);
exports.startPM2TaskByEcosystemFileInCurrentBuild = flow(startPM2TaskByEcosystemFileInCurrentBuild);

exports.reloadPM2TaskByEcosystemFile = flow(reloadPM2TaskByEcosystemFile);
exports.reloadPM2TaskByEcosystemFileInCurrentBuild = flow(reloadPM2TaskByEcosystemFileInCurrentBuild);