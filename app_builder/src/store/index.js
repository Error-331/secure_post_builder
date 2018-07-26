'use strict';

// external imports
const {observable} = require('mobx');

// local imports
const tasksState = require('./tasks');

// implementation
const store = observable({
  tasks: {}
});

// exports
module.exports = store;