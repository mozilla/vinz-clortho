/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* A simple in-memory throttle for failed authentication.  This being
 * in memory means a couple things:
 *  * For multiple server deployments, authenticationt throttling
 *    counts are node-local
 *  * client code should not add failed authentication attempts
 *    for non-existant users, lest a remote attacker can fatally bloat
 *    process memory
 */

var config = require('./configuration');

/* keep track of failed authentication attempt.  Keys are email addresses,
 * values include `time` (time of last failure) and `count` (the number
 * of consecutive failures */
var fails = {};

exports.check = function(email, cb) {
  if (fails[email]) {
    if ((new Date() - fails[email].time) > config.get('auth_lockout_ms')) {
      delete fails[email];
    }
  }

  if (!cb) return;

  process.nextTick(function() {
    if (fails[email] &&
        fails[email].count > config.get('auth_lockout_attempts')) {
      cb("lockout");
    } else {
      cb(null);
    }
  });
};

exports.failed = function(email, cb) {
  if (!fails[email]) {
    fails[email] = { count: 0 };
  }

  fails[email].count++;
  fails[email].time = new Date();

  if (cb) process.nextTick(cb);
};

exports.clear = function(email, cb) {
  if (fails[email]) delete fails[email];
  if (cb) process.nextTick(cb);
};
