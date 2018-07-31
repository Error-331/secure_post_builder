'use strict';

// external imports
const {resolve} = require('path');
const {flow} = require('mobx');
const {defaultTo} = require('ramda');

const execa = require('execa');
const moment = require('moment');

// local imports
const {
    OLD_BUILD_DIRECTORY_NAME,
    CURRENT_BUILD_DIRECTORY_NAME,

    ENV_FILE_NAME
} = require('./../constants/common_builds');

const {
    getPathToSourceArchiveFile,
    getPathToDestinationArchiveFile,
    isOldBuildDirExistInDestinationDir,
    isCurrentBuildDirExistInDestinationDir
} = require('./../helpers/strategy');

// implementation
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
    const pathToEcosystemFile = defaultTo('./ecosystem.config.js')(pm2EcosystemConfigFileLocation);

    // start pm2 tasks using ecosystem config file
    return yield execa('pm2', ['start', pathToEcosystemFile], {cwd});
}

function * startPM2TaskByEcosystemFileInCurrentBuild(task) {
    const {pathToDistFolder} = task.currentConfig;
    const cwd = resolve(pathToDistFolder, CURRENT_BUILD_DIRECTORY_NAME);

    return yield * startPM2TaskByEcosystemFile(task, cwd)
}

function * reloadPM2TaskByEcosystemFile(task, cwd) {
    // get path to destination folder and path to pm2 ecosystem config file
    const {pm2EcosystemConfigFileLocation} = task.currentConfig;
    const pathToEcosystemFile = defaultTo('./ecosystem.config.js')(pm2EcosystemConfigFileLocation);

    // start pm2 tasks using ecosystem config file
    return yield execa('pm2', ['reload', pathToEcosystemFile], {cwd});
}

function * reloadPM2TaskByEcosystemFileInCurrentBuild(task) {
    const {pathToDistFolder} = task.currentConfig;
    const cwd = resolve(pathToDistFolder, CURRENT_BUILD_DIRECTORY_NAME);

    return yield * reloadPM2TaskByEcosystemFile(task, cwd)
}

// throws error
function * copyENVFile(task) {
    const {pathToDistFolder} = task.currentConfig;

    const envFileLocation = resolve(pathToDistFolder, ENV_FILE_NAME);
    const currentBuildDirectoryLocation = resolve(pathToDistFolder, CURRENT_BUILD_DIRECTORY_NAME);
    const newEnvFileLocation = resolve(currentBuildDirectoryLocation, ENV_FILE_NAME);

    return yield execa('cp', [envFileLocation, newEnvFileLocation]);
}

function * makeBuildFromArchive(task) {
    // prepare `execa` results array
    const execaResults = [];

    // get path to destination folder and archive file name
    const {pathToDistFolder, archiveFileNameToWatch} = task.currentConfig;

    // delete existent archive file in destination directory
    execaResults.push(yield execa('rm', ['-f', archiveFileNameToWatch], {cwd: pathToDistFolder}));

    // copy archive from source directory to destination directory
    execaResults.push(yield execa('cp', [getPathToSourceArchiveFile(task), getPathToDestinationArchiveFile(task)]));

    // compose build directory name
    const buildFolderName = moment().format('D_MM_YYYY__H_mm_ss');

    // prepare build directory (inside destination folder) with specific name (timestamp like) for tar (archive) files
    execaResults.push(yield execa('mkdir', ['-p', buildFolderName], {cwd: pathToDistFolder}));

    // untar archive to build directory (inside destination folder) with specific name (timestamp like)
    execaResults.push(yield execa('tar', ['-xvf', archiveFileNameToWatch, '-C', buildFolderName], {cwd: pathToDistFolder}));

    // delete 'old_build' directory if it is exist
    if (isOldBuildDirExistInDestinationDir(task)) {
        execaResults.push(yield execa('rm', ['-rf', OLD_BUILD_DIRECTORY_NAME], {cwd: pathToDistFolder}));
    }

    // rename 'current_build' directory to 'old_build'
    if (isCurrentBuildDirExistInDestinationDir(task)) {
        execaResults.push(yield execa('mv', [CURRENT_BUILD_DIRECTORY_NAME, OLD_BUILD_DIRECTORY_NAME], {cwd: pathToDistFolder}));
    }

    // rename build directory to 'current_build'
    execaResults.push(yield execa('mv', [buildFolderName, CURRENT_BUILD_DIRECTORY_NAME], {cwd: pathToDistFolder}));

    // return `execa` results
    return execaResults;
}

// exports
exports.stopPM2TaskByName = flow(stopPM2TaskByName);
exports.stopPM2TaskByNameSilent = flow(stopPM2TaskByNameSilent);

exports.startPM2TaskByName = flow(startPM2TaskByName);
exports.startPM2TaskByEcosystemFile = flow(startPM2TaskByEcosystemFile);
exports.startPM2TaskByEcosystemFileInCurrentBuild = flow(startPM2TaskByEcosystemFileInCurrentBuild);

exports.reloadPM2TaskByEcosystemFile = flow(reloadPM2TaskByEcosystemFile);
exports.reloadPM2TaskByEcosystemFileInCurrentBuild = flow(reloadPM2TaskByEcosystemFileInCurrentBuild);

exports.copyENVFile = flow(copyENVFile);
exports.makeBuildFromArchive = flow(makeBuildFromArchive);
