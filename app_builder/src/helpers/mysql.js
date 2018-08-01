'use strict';

// external imports
const {__, isNil, gt, curry, map, values, any} = require('ramda');
const mysql = require('mysql');

// local imports

// implementation
function extractFirstColumnValues(rows) {
    return  map(row => values(row)[0], rows);
}

function countRowsInTable(connection, tableName) {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT COUNT(*) as COUNT FROM ${tableName}`, (error, results) => {
            if (isNil(error)) {
                resolve(results[0].COUNT);
            } else {
                reject(error);
            }
        });
    });
}

function getMySQLConnection(connectionConfig) {
    const connection = mysql.createConnection(connectionConfig);
    connection.connect();

    return connection;
}

function getDatabaseTablesList(connection) {
    return new Promise((resolve, reject) => {
        connection.query('SHOW TABLES', (error, rows) => {
            if (isNil(error)) {
                resolve(extractFirstColumnValues(rows));
            } else {
                reject(error);
            }
        });
    });
}

function checkAtLeastOneTableNotEmpty(connection, tablesList = []) {
    return new Promise(async (resolve, reject) => {
        try {
            const rowCount = await Promise.all(map(curry(countRowsInTable)(connection), tablesList));
            resolve(any(gt(__, 0))(rowCount))
        } catch(error) {
            reject(error);
        }
    });


}

// exports
exports.extractFirstColumnValues = extractFirstColumnValues;

exports.getMySQLConnection = getMySQLConnection;
exports.getDatabaseTablesList = getDatabaseTablesList;

exports.checkAtLeastOneTableNotEmpty = checkAtLeastOneTableNotEmpty;