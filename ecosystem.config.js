'use strict';

// external imports

// local imports

// exports
module.exports = {
    apps : [
        {
            name: 'secure_post_builder',
            script: './index.js',
            env: {
                NODE_ENV: 'production'
            },
        }
    ],
};
