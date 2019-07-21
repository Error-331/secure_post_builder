'use strict';

// external imports
const {flow} = require('mobx');
const {isNil, defaultTo} = require('ramda');

const execa = require('execa');
const envfile = require('envfile');
const moment = require('moment');

// local imports
const {
    OLD_BUILD_DIRECTORY_NAME,
    CURRENT_BUILD_DIRECTORY_NAME,

    ENV_FILE_NAME
} = require('./../constants/common_builds');

const {
    getPathToFileInDistFolder,
    getPathToEnvFile,
    getPathToFileInCurrentBuild,
    getPathToCurrentBuild,
} = require('./../helpers/common_builds');

const {
    getPathToSourceArchiveFile,
    getPathToDestinationArchiveFile,
    isOldBuildDirExistInDestinationDir,
    isCurrentBuildDirExistInDestinationDir
} = require('./../helpers/strategy');

// implementation
function * deleteFile(task, pathToFile, options, cwd) {
    // get task destination folder
    const {pathToDistFolder} = task.currentConfig;

    // prepare options
    options = defaultTo([])(options).concat(pathToFile);

    // prepare cwd
    cwd = defaultTo(pathToDistFolder)(cwd);

    // remove file
    return yield execa('rm', options, {cwd})
}

function * deleteFileForce(task, pathToFile, options, cwd) {
    // prepare options
    options = ['-rf'].concat(defaultTo([])(options));

    // force remove file
    return yield * deleteFile(task, pathToFile, options, cwd);
}

function * deleteFileInCurrentBuild(task, taskName, flowConfig) {
    const cwd = getPathToCurrentBuild(task);
    return yield * deleteFileForce(task, flowConfig.path, [], cwd);
}

function * copyFile(task, from, to, cwd) {
    return yield execa('cp', [from, to], {cwd});
}

// throws error
function * copyFileFromDistToBuild(task, taskName, flowConfig) {
    const fileLocation = getPathToFileInDistFolder(task, flowConfig.from);
    const newFileLocation = getPathToFileInCurrentBuild(task, flowConfig.to);

    return yield * copyFile(task, fileLocation, newFileLocation);
}

// throws error
function * copyENVFile(task) {
    const envFileLocation = getPathToEnvFile(task);
    const newEnvFileLocation = getPathToFileInCurrentBuild(task, ENV_FILE_NAME);

    return yield * copyFile(task, envFileLocation, newEnvFileLocation);
}

function * parseEnvFile(task) {
    const envFileLocation = getPathToEnvFile(task);

    return yield new Promise((resolve, reject) => {
        envfile.parseFile(envFileLocation, (error, parsedEnvObject) => isNil(error) ? resolve(parsedEnvObject) : reject(error))
    });
}

function * makeBuildFromArchive(task) {
    // prepare `execa` results array
    const execaResults = [];

    // get path to destination folder and archive file name
    const {pathToDistFolder, archiveFileNameToWatch} = task.currentConfig;

    // delete existent archive file in destination directory
    execaResults.push(yield * deleteFileForce(task, archiveFileNameToWatch));

    // copy archive from source directory to destination directory
    execaResults.push(yield * copyFile(task, getPathToSourceArchiveFile(task), getPathToDestinationArchiveFile(task)));

    // compose build directory name
    const buildFolderName = moment().format('D_MM_YYYY__H_mm_ss');

    // prepare build directory (inside destination folder) with specific name (timestamp like) for tar (archive) files
    execaResults.push(yield execa('mkdir', ['-p', buildFolderName], {cwd: pathToDistFolder}));

    // untar archive to build directory (inside destination folder) with specific name (timestamp like)
    execaResults.push(yield execa('tar', ['-xvf', archiveFileNameToWatch, '-C', buildFolderName], {cwd: pathToDistFolder}));

    // delete 'old_build' directory if it is exist
    if (isOldBuildDirExistInDestinationDir(task)) {
        execaResults.push(yield * deleteFileForce(task, OLD_BUILD_DIRECTORY_NAME));
    }

    // rename 'current_build' directory to 'old_build'
    if (isCurrentBuildDirExistInDestinationDir(task)) {
        execaResults.push(yield execa('mv', [CURRENT_BUILD_DIRECTORY_NAME, OLD_BUILD_DIRECTORY_NAME], {cwd: pathToDistFolder}));
    }

    // rename build directory to 'current_build'
    execaResults.push(yield execa('mv', [buildFolderName, CURRENT_BUILD_DIRECTORY_NAME], {cwd: pathToDistFolder}));

    // delete existent archive file in destination directory
    execaResults.push(yield * deleteFileForce(task, archiveFileNameToWatch));

    // return `execa` results
    return execaResults;
}

// exports
exports.deleteFile = flow(deleteFile);
exports.deleteFileForce = flow(deleteFileForce);
exports.deleteFileInCurrentBuild = flow(deleteFileInCurrentBuild);
exports.copyFile = flow(copyFile);
exports.copyFileFromDistToBuild = flow(copyFileFromDistToBuild);

exports.copyENVFile = flow(copyENVFile);
exports.parseEnvFile = flow(parseEnvFile);

exports.makeBuildFromArchive = flow(makeBuildFromArchive);
