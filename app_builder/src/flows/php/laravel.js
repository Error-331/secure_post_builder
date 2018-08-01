'use strict';

// external imports
const {flow} = require('mobx');
const execa = require('execa');
const {without} = require('ramda');

// local imports
const {gatPathToCurrentBuild} = require('./../../helpers/common_builds');

const {parseEnvFile} = require('./../common_builds');
const {getMySQLConnection, checkAtLeastOneTableNotEmpty, getDatabaseTablesList} = require('./../../helpers/mysql');

// implementation
function * runLaravelMigrationsInCurrentBuild(task) {
    // prepare path to current build
    const cwd = gatPathToCurrentBuild(task);

    // start pm2 tasks using ecosystem config file
    return yield execa('php', ['artisan', 'migrate'], {cwd});
}

function * runLaravelSeedsInCurrentBuild(task) {
    // parse .env file
    const envConfigObj = yield parseEnvFile(task);
    console.log('------');

    // prepare sql connection configuration object
    const sqlConnectionConfigObject = {
        host: envConfigObj.DB_HOST,
        user: envConfigObj.DB_USERNAME,
        password: envConfigObj.DB_PASSWORD,
        database: envConfigObj.DB_DATABASE
    };

    // get connection to SQL database
    const sqlDBConnection = getMySQLConnection(sqlConnectionConfigObject);

    // get tables list of current database
    const tablesList = yield getDatabaseTablesList(sqlDBConnection);

    // check if database not empty
    const isNotDatabaseEmpty = yield checkAtLeastOneTableNotEmpty(sqlDBConnection, without(['migrations'], tablesList));

    // close connection to SQL database
    sqlDBConnection.end();

    if (!isNotDatabaseEmpty) {
        // prepare path to current build
        const cwd = gatPathToCurrentBuild(task);

        // 'seed' database with values
        return yield execa('php', ['artisan', 'db:seed'], {cwd});
    }

    // return null if database not empty
    return null;
}

// exports
exports.runLaravelMigrationsInCurrentBuild = flow(runLaravelMigrationsInCurrentBuild);
exports.runLaravelSeedsInCurrentBuild = flow(runLaravelSeedsInCurrentBuild);