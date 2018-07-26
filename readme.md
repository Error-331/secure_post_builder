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
list of available strategies in ['Strategies list'](#strategies-list)). The `label` defines a literal representation of the task and mainly used in logs. Pay attention that
there should be no two (or more) tasks with the same `label`.

## Strategies

### Strategies list

`pm2_nodejs_simple` - strategy suitable for building regular NodeJS projects by means of PM2 `ecosystem.config.js` file.

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

