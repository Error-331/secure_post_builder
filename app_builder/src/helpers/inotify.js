'use strict';

// external imports
const Inotify = require('inotify').Inotify;
const {__, is, isNil, equals, length, gt, max, all, any, complement, defaultTo, always, curry, unless, ifElse, slice, forEach, reduce} = require('ramda');

// local imports
const {TAR_ARCHIVE_MODIFIED_MASK_CHAINS} = require('./../constants/inotify');

// implementation
let inotifyInstance = null;

function createDefaultInotifyInstance() {
  inotifyInstance = new Inotify();
  return inotifyInstance;
}

function getDefaultInotifyInstance() {
  inotifyInstance = unless(complement(isNil), createDefaultInotifyInstance)(inotifyInstance);
  return inotifyInstance
}

function getMaskChainVariantsMaxMasks(maskChains) {
  return reduce((maxMasks, maskChain) => max(length(maskChain), maxMasks), 0, maskChains);
}

// throws error
function removeWatcher(watchDescriptor) {
  const currentInotifyInstance = getDefaultInotifyInstance();
  currentInotifyInstance.removeWatch(watchDescriptor);
}

// throws error
function removeWatchers(watchDescriptors) {
  forEach(removeWatcher, watchDescriptors);
}

function addWatch(path, watchFor, callback = () => {}) {
  const currentInotifyInstance = getDefaultInotifyInstance();

  return currentInotifyInstance.addWatch({
    path,
    watch_for: watchFor,
    callback
  });
}

function checkInotifyEventByMasks(mandatoryMasks, additionalMasks, negativeMasks, filename, event) {
  const {mask, name} = event;

  if (filename !== name) {
    return false;
  }

  mandatoryMasks = defaultTo([1])(mandatoryMasks);
  additionalMasks = defaultTo([1])(additionalMasks);
  negativeMasks = defaultTo([0])(negativeMasks);

  const maskCheckPositiveFunc = userMask => gt(userMask & mask, 0);
  const maskCheckNegativeFunc = userMask => equals(userMask & mask, 0);

  const mandatoryMasksResult = ifElse(
    is(Object),
    userMasks => all(maskCheckPositiveFunc, userMasks),
    maskCheckPositiveFunc
  )(mandatoryMasks);

  const additionalMasksResult = ifElse(
    is(Object),
    userMasks => any(maskCheckPositiveFunc, userMasks),
    maskCheckPositiveFunc
  )(additionalMasks);

  const negativeMasksResult = ifElse(
    is(Object),
    userMasks => all(maskCheckNegativeFunc, userMasks),
    maskCheckNegativeFunc
  )(negativeMasks);

  return mandatoryMasksResult && additionalMasksResult && negativeMasksResult;
}

function isUserMaskChainMatch(inotifyMaskChains, userMaskChain) {
  return any((inotifyMaskChain) => {
    const inotifyMaskChainLength = length(inotifyMaskChain);
    const userMaskChainLength = length(userMaskChain);

    const truncatedUserMaskChain = slice(userMaskChainLength - inotifyMaskChainLength, Infinity, userMaskChain);
    return equals(truncatedUserMaskChain, inotifyMaskChain)
  })(inotifyMaskChains);
}

// exports
exports.getDefaultInotifyInstance = getDefaultInotifyInstance;
exports.getMaskChainVariantsMaxMasks = getMaskChainVariantsMaxMasks;

exports.removeWatcher = removeWatcher;
exports.removeWatchers = removeWatchers;
exports.addWatch = addWatch;
exports.checkInotifyEventByMasks = checkInotifyEventByMasks;
exports.isUserMaskChainMatch = isUserMaskChainMatch;

// File system specific methods
exports.addWatchAllEvents = curry(addWatch)(__, Inotify.IN_ALL_EVENTS, __);
exports.addWatchDirectoryContentChange = curry(addWatch)(__, Inotify.IN_ISDIR | Inotify.IN_CREATE | Inotify.IN_MOVED_TO | Inotify.IN_MOVED_FROM | Inotify.IN_DELETE, __);
exports.addWatchFileChange = curry(addWatch)(__, Inotify.IN_MODIFY | Inotify.IN_MOVE_SELF | Inotify.IN_DELETE_SELF, __);

exports.isFileDirectoryCreatedInDirectory = curry(checkInotifyEventByMasks)([], [Inotify.IN_CREATE, Inotify.IN_MOVED_TO], []);
exports.isFileCreatedInDirectory = curry(checkInotifyEventByMasks)([], [Inotify.IN_CREATE, Inotify.IN_MOVED_TO], Inotify.IN_ISDIR);
exports.isDirectoryCreatedInDirectory = curry(checkInotifyEventByMasks)(Inotify.IN_ISDIR, [Inotify.IN_CREATE, Inotify.IN_MOVED_TO], []);

exports.isFileDirectoryDeletedInDirectory = curry(checkInotifyEventByMasks)([], [Inotify.IN_MOVED_FROM, Inotify.IN_DELETE], []);
exports.isFileDeletedInDirectory = curry(checkInotifyEventByMasks)([], [Inotify.IN_MOVED_FROM, Inotify.IN_DELETE], [Inotify.IN_ISDIR]);
exports.isDirectoryDeletedInDirectory = curry(checkInotifyEventByMasks)([Inotify.IN_ISDIR], [Inotify.IN_MOVED_FROM | Inotify.IN_DELETE], []);

// Tar archive specific functions
exports.addWatchDirectoryTarArchiveCreated = curry(addWatch)(__, Inotify.IN_MODIFY | Inotify.IN_CLOSE_WRITE | Inotify.IN_CLOSE_NOWRITE | Inotify.IN_OPEN | Inotify.IN_ACCESS, __);
exports.addWatchDirectoryTarArchiveCreatedOrDeleted = curry(addWatch)(__, Inotify.IN_MODIFY | Inotify.IN_CLOSE_WRITE | Inotify.IN_CLOSE_NOWRITE | Inotify.IN_OPEN | Inotify.IN_ACCESS | Inotify.IN_MOVED_FROM | Inotify.IN_DELETE, __);

exports.getTarArchiveCreatedInDirectoryMaxMasksInChain = always(getMaskChainVariantsMaxMasks(TAR_ARCHIVE_MODIFIED_MASK_CHAINS));
exports.isTarArchiveCreatedInDirectory = curry(checkInotifyEventByMasks)([], [Inotify.IN_MODIFY, Inotify.IN_CLOSE_WRITE, Inotify.IN_CLOSE_NOWRITE, Inotify.IN_OPEN, Inotify.IN_ACCESS], Inotify.IN_ISDIR);
exports.isTarArchiveCreatedInDirectoryByMaskChain = curry(isUserMaskChainMatch)(TAR_ARCHIVE_MODIFIED_MASK_CHAINS);
