'use strict';

// external imports

// local imports
const {logWarn} = require('../helpers/logs');

// implementation
const mainConfigJSONWatcherTaskStrategy = (taskConfig) => {

};

function taskStrategyPatternFactory(strategyName) {
    switch(strategyName) {
        case 'main_config_json_watcher_task':
            return mainConfigJSONWatcherTaskStrategy;
        case 'pm2_nodejs_simple':
            return require('./nodejs/pm2_nodejs_simple').pm2NodejsSimple;
        case 'pm2_nodejs_hapijs_web_futuristics_common':
            return require('./nodejs/pm2_nodejs_hapijs_web_futuristics_common').pm2NodejsHapijsWebFuturisticsCommon;
        case 'laravel_php_simple':
            return require('./php/laravel_php_simple');
        default:
            logWarn(`Cannot find strategy for strategy named: ${strategyName}`);
            return null;
    }
}

// exports
exports.taskStrategyPatternFactory = taskStrategyPatternFactory;