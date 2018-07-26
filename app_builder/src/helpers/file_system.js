'use strict';

// external imports
const {join, basename} = require('path');
const {constants, existsSync, accessSync, readFileSync, writeFileSync} = require('fs');
const {__, T, F, equals, complement, cond} = require('ramda');

// local imports

// implementation
// throws error
function isFileExistsSync(pathToFile) {
    return existsSync(pathToFile);
}

// throws error
function isPathReadableSync(pathToCheck) {
    try {
        accessSync(pathToCheck, constants.R_OK);
    } catch (error) {
        return cond([
            [equals('ENOENT'), () => {throw error;}],
            [T, F]
        ])(error.code);
    }

    return T();
}

// throws error
function isPathWritableOrThrowErrorSync(pathToCheck) {
    accessSync(pathToCheck, constants.W_OK);
    return T();
}

// not very reliable - need to check whether dir was created
function isPathExistOrCreateSync(pathToCheck, mode = 0o777) {
    return cond([
        [existsSync, T],
        [complement(existsSync), pathToCheck => {internals.createDirectorySync(pathToCheck, mode); return true}]
    ])(pathToCheck);
}

// TODO: replace with native copyFileSync in future node
function copyFileSync(fromFile, toFile) {
    const targetFile = join(toFile, basename(fromFile));
    writeFileSync(targetFile, readFileSync(fromFile));
}

// exports
exports.isFileExistsSync = isFileExistsSync;
exports.isPathReadableSync = isPathReadableSync;
exports.isPathWritableOrThrowErrorSync = isPathWritableOrThrowErrorSync;
exports.isPathExistOrCreateSync = isPathExistOrCreateSync;
exports.copyFileSync = copyFileSync;