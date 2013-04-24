#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ldap = require('ldapjs'),
    config = require('../server/lib/configuration'),
      path = require('path');

process.on('uncaughtException', function(err) {
  console.error('uncaught exception', err);
});

var auth = require('../server/lib/auth');

if (process.argv.length !== 4) {
  var progName = path.basename(process.argv[1]);
  console.error(util.format("%s: using mozilla credentials, authenticate to " +
                            "LDAP", progName));
  console.error(util.format("USAGE: %s <username> <password>"), progName);
  process.exit(1);
}

auth.authEmail({
  email: process.argv[2],
  password: process.argv[3]
}, function (err, passed) {
  console.log(err, passed);
});
