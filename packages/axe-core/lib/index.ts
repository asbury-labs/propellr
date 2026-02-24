/**
 * axe-core -- Vite library mode entry point
 *
 * This file is the ES module entry point for Vite's library mode build.
 * It replaces the legacy stub-based concatenation approach (intro.stub,
 * core/index.ts, outro.stub) with a proper ES module that Vite can
 * process into UMD, ESM, and CJS outputs automatically.
 *
 * IMPORTANT: The Vite config's `axeGlobalPlugin` injects `var axe = {};`
 * at the top of each output chunk (via `renderChunk`).  Many source files
 * reference `axe` as an ambient global (the legacy Grunt build made this
 * available via concatenation).  This entry point populates the pre-existing
 * object and re-exports it.
 *
 * The existing lib/core/core.ts and lib/core/index.ts are NOT modified
 * and remain in use for the legacy Grunt build during the transition.
 */

declare const __AXE_VERSION__: string;

// ---------------------------------------------------------------------------
// Core imports (mirrors lib/core/core.ts)
// ---------------------------------------------------------------------------

import constants from './core/constants';
import log from './core/log';

import AbstractVirtualNode from './core/base/virtual-node/abstract-virtual-node';
import SerialVirtualNode from './core/base/virtual-node/serial-virtual-node';
import VirtualNode from './core/base/virtual-node/virtual-node';
import cache from './core/base/cache';

import * as imports from './core/imports';

import cleanup from './core/public/cleanup';
import configure from './core/public/configure';
import frameMessenger from './core/public/frame-messenger';
import getRules from './core/public/get-rules';
import load from './core/public/load';
import registerPlugin from './core/public/plugins';
import { hasReporter, getReporter, addReporter } from './core/public/reporter';
import reset from './core/public/reset';
import runRules from './core/public/run-rules';
import runVirtualRule from './core/public/run-virtual-rule';
import run from './core/public/run';
import runPartial from './core/public/run-partial';
import finishRun from './core/public/finish-run';
import setup from './core/public/setup';
import teardown from './core/public/teardown';

import naReporter from './core/reporters/na';
import noPassesReporter from './core/reporters/no-passes';
import rawEnvReporter from './core/reporters/raw-env';
import rawReporter from './core/reporters/raw';
import v1Reporter from './core/reporters/v1';
import v2Reporter from './core/reporters/v2';

import * as commons from './commons';
import * as utils from './core/utils';

import metadataFunctionMap from './core/base/metadata-function-map';
import { setMetadataFunctionMap } from './core/base/check';
import _thisWillBeDeletedDoNotUse from './core/_exposed-for-testing';
import defaultConfig from './core/generated/default-config';

// ---------------------------------------------------------------------------
// Build the axe object -- a proper local variable that rolldown can export
// ---------------------------------------------------------------------------

const axeExport: Record<string, any> = {
  // Version -- replaced at build time by Vite's `define` option
  version: __AXE_VERSION__,

  // Constants & logging
  constants,
  log,

  // Virtual node classes
  AbstractVirtualNode,
  SerialVirtualNode,
  VirtualNode,

  // Internal cache
  _cache: cache,

  // Lazy-loaded dependencies
  imports,

  // Public API
  cleanup,
  configure,
  frameMessenger,
  getRules,
  _load: load,
  plugins: {},
  registerPlugin,
  hasReporter,
  getReporter,
  addReporter,
  reset,
  _runRules: runRules,
  runVirtualRule,
  run,
  setup,
  teardown,
  runPartial,
  finishRun,

  // Shared modules
  commons,
  utils,

  // Exposed internals (for testing only -- will be removed)
  _thisWillBeDeletedDoNotUse
};

// Copy all properties to the global `axe` object so that modules that
// reference `axe.utils`, `axe._memoizedFns`, etc. at runtime see the
// populated object.  The `var axe = {};` is injected by axeGlobalPlugin.
declare let axe: Record<string, any>;
if (typeof axe !== 'undefined') {
  Object.assign(axe, axeExport);
}

// ---------------------------------------------------------------------------
// Register built-in reporters
// ---------------------------------------------------------------------------

addReporter('na', naReporter);
addReporter('no-passes', noPassesReporter);
addReporter('rawEnv', rawEnvReporter);
addReporter('raw', rawReporter);
addReporter('v1', v1Reporter);
addReporter('v2', v2Reporter, true); // v2 is the default reporter

// ---------------------------------------------------------------------------
// Initialize the metadata function map (must happen before load)
// ---------------------------------------------------------------------------
// The map is injected via a setter to break the circular dependency between
// check.ts -> metadata-function-map.ts -> checks/*.ts -> commons/* -> core/*
setMetadataFunctionMap(metadataFunctionMap);

// ---------------------------------------------------------------------------
// Load default configuration (rules, checks, metadata)
// ---------------------------------------------------------------------------

load(defaultConfig);

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default axeExport;
