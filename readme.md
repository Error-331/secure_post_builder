# Secure post builder

Jenkins like build system written in JS.

This package is intended to be used in conjunction with another build system like [Jenkins](https://jenkins.io/). Basically this package watch for file changes made by `Jenkins` and perform
necessary operations (like copying files from Jenkins directory to some destination directory or restarting some services). The main feature of this package is that it meant to be run under 
another Linux user (like `www-data`) which helps to decouple `Jenkins` user from any other user in the system thus making software builds more secure.

All strategies are written in JS utilizing [Execa](https://github.com/sindresorhus/execa) package which gives possibility to write powerful and highly customizable tasks.

## Configuration

Note that the `secure post builder` should be launched by `www-data` user.

### Tasks configuration

All tasks configuration should be put to `tasks.json` file in the root of `secure post builder` package. This file should be readable.

### tasks.json configuration

In general, the file should look like this:

```json

{
  "tasks": {
    "tasks1": {
      ...task 1 configuration
    },
    
    "tasks2": {
      ...task 2 configuration
    },
    
    ...task N defination
  }
}

```

Each task should have at least two fields defined, which are `strategy` and `label`. The `strategy` field defines which strategy should be used for post build deployment (you can find the 
list of available strategies in [Strategies list](#strategies-list)). The `label` defines a literal representation of the task and mainly used in logs. Pay attention that
there should be no two (or more) tasks with the same `label`.

## Strategies

### Strategies list

`pm2_nodejs_simple` - strategy suitable for building regular [NodeJS](https://nodejs.org/) projects by means of [PM2](http://pm2.keymetrics.io/) `ecosystem.config.js` file.

`laravel_php_simple` - strategy suitable for building regular [PHP](http://php.net/) projects which utizize [Laravel](https://laravel.com/) framework.

#### pm2_nodejs_simple

Task watches the directory specified in `pathToSourceFolder` for creation/modification of `archiveFileNameToWatch`. Each time the `archiveFileNameToWatch` is changed it is being copied to
`pathToDistFolder` where it will be extracted to `current` build directory while previous `current` build directory will be renamed to `old_build`. Relevant PM2 services will be restarted.

##### Options

`strategy` - strategy name (should be `pm2_nodejs_simple`);

`label` - literal representation of the task (any string);

`pathToSourceFolder` - path to source directory where archive with source code resides;

`pathToDistFolder` - path to destination directory where unpacking of source code archive will take place;

`archiveFileNameToWatch` - name of the archive file (in `pathToSourceFolder` directory) which will be monitored for changes;
  
`pm2TaskName` - name of the PM2 task which should be restarted during task work;

`pm2Options` - command line options which will be passed to PM2;
  
`fileWatchDogTimeout` - timeout in milliseconds after which internal state of the task will be reseted (to prevent erroneous behaviour, default is 6000);

`archiveWatchDebounceWait` - timeout in milliseconds after which task will initiate its strategy after necessary Inotify events were captured (default is 4000);

##### Example

```json

{
  "tasks": {
    "testNodeJSTask": {
      "strategy": "pm2_nodejs_simple",
      "label": "Frontend service (development)",

      "pathToSourceFolder": "/home/someuser/testfrom",
      "pathToDistFolder": "/home/someuser/testto",
      "archiveFileNameToWatch": "testfrom.tar.gz",
      "pm2TaskName": "js_ui_components"
    }
  }
}

```

#### pm2_nodejs_hapijs_web_futuristics_common

Task watches the directory specified in `pathToSourceFolder` for creation/modification of `archiveFileNameToWatch`. Each time the `archiveFileNameToWatch` is changed it is being copied to
`pathToDistFolder` where it will be extracted to `current` build directory while previous `current` build directory will be renamed to `old_build`. Prior to deleting previous build, the UNIX 
socket (used by server is also deleted) will be deleted as well. Before reloading the PM2 task, builder will try to build frontend files by means of running `build-frontend-production` NPM task.
Relevant PM2 services will be restarted.

##### Options

`strategy` - strategy name (should be `pm2_nodejs_hapijs_web_futuristics_common`);

`label` - literal representation of the task (any string);

`pathToSourceFolder` - path to source directory where archive with source code resides;

`pathToDistFolder` - path to destination directory where unpacking of source code archive will take place;

`archiveFileNameToWatch` - name of the archive file (in `pathToSourceFolder` directory) which will be monitored for changes;
  
`pm2TaskName` - name of the PM2 task which should be restarted during task work;

`pm2Options` - command line options which will be passed to PM2;

`linuxSocketPath` - path to UNIX socket file created by the server (it will be deleted);
  
`fileWatchDogTimeout` - timeout in milliseconds after which internal state of the task will be reseted (to prevent erroneous behaviour, default is 6000);

`archiveWatchDebounceWait` - timeout in milliseconds after which task will initiate its strategy after necessary Inotify events were captured (default is 4000);

##### Example

```json

{
  "tasks": {
    "testNodeJSTaskHapiCommonWebFuturistics": {
      "strategy": "pm2_nodejs_hapijs_web_futuristics_common",
      "label": "Frontend service (web futuristics development)",

      "pathToSourceFolder": "/home/someuser/testfromnode1",
      "pathToDistFolder": "/home/someuser/testtonode1",
      "archiveFileNameToWatch": "testfrom.tar.gz",
      "pm2TaskName": "hr_frontend_service_production_development",
      "pm2Options": "--only hr_frontend_service_production_development",
      "linuxSocketPath": "./hr_front_service_socket",

      "fileWatchDogTimeout": 6000,
      "archiveWatchDebounceWait": 4000
    }
  }
}

```

#### laravel_php_simple

Similar too [pm2_nodejs_simple](pm2_nodejs_simple) except there will be not service reloading using `PM2`, but the `.env` (configuration file for `Laravel` framework) 
file will be copied from `pathToDistFolder` directory to `current` build directory. Builder will also run migrations for current build as well as attempt to run default seeders if
database is empty.

##### Options

`strategy` - strategy name (should be `laravel_php_simple`);

`label` - literal representation of the task (any string);

`pathToSourceFolder` - path to source directory where archive with source code resides;

`pathToDistFolder` - path to destination directory where unpacking of source code archive will take place;

`archiveFileNameToWatch` - name of the archive file (in `pathToSourceFolder` directory) which will be monitored for changes;
  
`fileWatchDogTimeout` - timeout in milliseconds after which internal state of the task will be reseted (to prevent erroneous behaviour, default is 6000);

`archiveWatchDebounceWait` - timeout in milliseconds after which task will initiate its strategy after necessary Inotify events were captured (default is 4000);

##### Example

```json

{
  "tasks": {
    "testPHPTask": {
      "strategy": "laravel_php_simple",
      "label": "Backend service (development)",

      "pathToSourceFolder": "/home/someuser/testfromphp",
      "pathToDistFolder": "/home/someuser/testtophp",
      "archiveFileNameToWatch": "testfrom.tar.gz"
    }
  }
}

```

## Inotify

### Watch flags to decimal numbers

IN_ACCESS        - 1 <br/>
IN_MODIFY        - 2 <br/>
IN_ATTRIB        - 4 <br/>
IN_CLOSE_WRITE   - 8 <br/>
IN_CLOSE_NOWRITE - 16 <br/>
IN_OPEN          - 32 <br/>
IN_MOVED_FROM    - 64 <br/>
IN_MOVED_TO      - 128 <br/>
IN_CREATE        - 256 <br/>
IN_DELETE        - 512 <br/>
IN_DELETE_SELF   - 1024 <br/>
IN_MOVE_SELF     - 2048

## TODO

- .tar archive creation at first time do not work - investigate and fix;
- if dist not exist - try to create it;
- if config reloads - need to somehow delete all watchers (if directory was deleted from outside - its watcher will be deleted by the system - double check);


    // if file system entities check fails, set erroneous state for current task
    if (equals(isFSEntitiesAccessible, false)) {
        return setTaskErroneousState(taskName);
    }
    
    - log here also;
    
    External Deletion Command(jenkins) : rm -rf %s

