/* a home for utilities common to all tests. */

// disable logging for tests when VERBOSE isn't defined in the env
if (!process.env['VERBOSE']) {
  (require('../../server/lib/logging.js')).disable();
}

// nothing to export right now!
module.exports = {};
