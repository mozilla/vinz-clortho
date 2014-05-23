#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

process.on('uncaughtException', function(err) {
  console.error('uncaught exception', err);
});

const ldap = require('ldapjs'),
    config = require('../server/lib/configuration'),
      path = require('path');

var argv = require('optimist')
.usage('Test authentication against LDAP.\nUsage: $0')
.alias('h', 'help')
.describe('h', 'display this usage message')
.alias('u', 'url')
.describe('u', 'LDAP server url')
.default('u', 'ldaps://addressbook.mozilla.com:636')
.alias('a', 'address')
.describe('a', 'email address to authenticate (may be an alias)')
.demand('a')
.alias('p', 'password')
.describe('p', 'LDAP account password')
.demand('p')
.alias('c', 'canonical')
.describe('c', 'canonical LDAP password (required when email is an alias)');

var args = argv.argv;

// request context (cookie jar, etc)
var ctx = {};

if (args.h) {
  argv.showHelp();
  process.exit(0);
}

var auth = require('../server/lib/auth');

var dn = auth.convertEmailToDN(args.c || args.a);

auth.canonicalAddress({
  email: args.a,
  dn: dn,
  pass: args.p,
  url: args.u
}, function(err, canonicalAddress) {
  if (err) {
    console.log(util.format("communication with LDAP failed (%s): %s",
                           err.name, err.message));
  } else {
    if (canonicalAddress == args.a) {
      console.log(args.a, "is canonical");
    } else {
      console.log(util.format("canonical address for %s is %s",
                              args.a, canonicalAddress));
    }

    auth.authUser({
      url: args.u,
      email: canonicalAddress,
      pass: args.p
    }, function (err, passed) {
      if (err) {
        console.log(util.format("authentication with LDAP failed (%s): %s",
                                err.name, err.message));
      } else {
        console.log(passed);
      }
    });
  }
});
