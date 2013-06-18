// vim: shiftwidth=2
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
    imapLib   = require('imap'),
    config = require('./configuration'),
    logger = require('./logging').logger,
    statsd = require('../lib/statsd'),
      util = require('util');

/*
 * Authenticate a user to LDAP provided an email and the user's LDAP password.
 * This performs the following:
 *  1. binds to LDAP using known credentials
 *  2. searches for the email address the user entered (to support aliases)
 *  3. re-binds as the target user and provided password
 *
 * The following arguments are accepted:
 *   imapServer: Hostname of the IMAPS server
 *        email: the user's email address (or alias) (used in #2)
 *     password: the user's LDAP password
 */
exports.authEmail = function(opts, authCallback) {
  if (!opts) throw "argument required";
  if (!opts.password) throw "password required";
  if (!opts.email) throw "email address required";

  opts.imapServer = opts.imapServer || config.get('imapServer');

  var imap = new imapLib({
    user: opts.email,
    password: opts.password,
    host: 'mail.mozilla.com',
    port: 993,
    secure: true,
    connTimeout: 2500
  });

  imap.connect(function(err) {
    if (err) {
      return authCallback(err);
    } else {
      imap.logout(function(err) {
        if (err) console.error("IMAP Logout Error: ", err);
      });
      return authCallback(null, true);
    }
  });
};


