'use strict';

import { execSync } from 'child_process';
import jest from 'jest';

const argv = process.argv.slice(2);

// INFO: Set environment variables for the testing environment
process.env.BABEL_ENV = 'test';

process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';

// INFO: Handle unhandled promise rejections by throwing an error
process.on('unhandledRejection', (err) => {
  throw err;
});

/**
 * Checks if the current directory is inside a Git repository.
 * @returns {boolean} True if inside a Git repository, false otherwise.
 */
function isInGitRepository() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if the current directory is inside a Mercurial repository.
 * @returns {boolean} True if inside a Mercurial repository, false otherwise.
 */
function isInMercurialRepository() {
  try {
    execSync('hg --cwd . root', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const isCoverage = argv.includes('--coverage');
const isNoWatch = argv.includes('--no-watch');

// INFO: Adjust the arguments for jest based on the presence of source control
if (
  !process.env.CI &&
  !process.env.DEV &&
  !isCoverage &&
  !isNoWatch &&
  argv.indexOf('--watchAll') === -1 &&
  argv.indexOf('--watchAll=false') === -1
) {
  const hasSourceControl = isInGitRepository() || isInMercurialRepository();
  argv.push(hasSourceControl ? '--watch' : '--watchAll');
}

// INFO: Add environment to jest arguments and run jest with the specified arguments
if (argv.indexOf('--env') === -1) {
  argv.push('--env', 'jsdom');
}

// INFO: Add CI specific arguments to jest arguments only running serial not parallel
if (process.env.CI) {
  argv.push('--runInBand');
  argv.push('--detectOpenHandles');
  argv.push('--forceExit');
}

jest.run(argv);
