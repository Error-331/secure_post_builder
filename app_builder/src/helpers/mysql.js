'use strict';

// external imports
const mysql = require('mysql');

// local imports

// implementation
function getMySQLConnection(connectionConfig) {
    const connection = mysql.createConnection(connectionConfig);
    connection.connect();

    return connection;
}

// exports
exports.getMySQLConnection = getMySQLConnection;