/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ldap = require('ldapjs'),
    config = require('./configuration'),
    logger = require('./logging').logger,
    statsd = require('../lib/statsd'),
      util = require('util'),
         _ = require('underscore'),
        fs = require('fs');

// check required configuration at startup
[ 'ldap_server_url', 'ldap_bind_dn', 'ldap_bind_password' ].forEach(function(k) {
  if (!config.has(k)) {
    logger.error(util.format("Configuration error, you must specifiy '%s'", k));
    process.exit(1);
  }
});

// create and connect an LDAP client, populate the options block
function createClient(opts, cb) {
  if (typeof opts !== 'object' || opts === null) throw new Error('invalid options parameter');
  opts.url = opts.url || config.get('ldap_server_url');
  opts.errorCallback = opts.errorCallback || function(err) {
    logger.warn(util.format('LDAP connection ended with unhandled error: %s', err));
  };

  cb = _.once(cb);

  var client = ldap.createClient({
    url: opts.url,
    connectTimeout: opts.connectTimeout || config.get('ldap_server_connect_timeout')
  });

  var connected = false;

  client.on('close', function(err) {
    if (!connected) {
      err = "connect failed";
    }
    if (err) {
      if (opts.errorCallback) opts.errorCallback(err);
      opts.errorCallback = null;
    }
  });

  client.on('error', function(err) {
    if (opts.errorCallback) {
      opts.errorCallback(err);
    }
    opts.errorCallback = null;
  });

  client.on('connect', function() {
    connected = true;
    cb(null, client);
  });
}

function checkOpts(required, got) {
  if (typeof got !== 'object' || got === null) {
    throw new Error("missing options object");
  }
  got = Object.keys(got);
  var missing = _.difference(required, got);
  if (missing.length) {
    throw new Error("missing required parameters: " + missing.join(', '));
  }
}

/* check if we can authenticate to an ldap server. arguments include:
 *          url: url to LDAP server
 *           dn: LDAP distinguished name to bind
 *         pass: credentials associated with DN
 */
exports.checkBindAuth = function(opts, cb) {
  opts.dn = opts.dn || config.get('ldap_bind_dn');
  opts.pass = opts.pass || config.get('ldap_bind_password');

  return exports.authUser(opts, cb);
};

// given an email, map it to a canonical address
exports.canonicalAddress = function(opts, cb) {
  checkOpts([ 'email' ], opts);

  process.nextTick(function() {
    cb(null, config.get('hardcoded_aliases')[opts.email] || opts.email);

    // XXX once we move away from a static file, let's implement LDAP based searching

    // 1. connect to LDAP server
    // 2. bind as headless user
    // 2. search for canonical address
    // 3. return canonical
  });
};

exports.authUser = function(opts, cb) {
  // opts.email - a user email to authenticate as
  // opts.dn - the dn to authenticate as

  // ensure cb is called only once
  cb = _.once(cb);

  // if email is provided, let's dynamically convert it into a bind dn
  if (opts.email) {
    if (opts.dn) throw new Error(".dn and .email are mutually exclusive");
    // is this a supported domain?
    var searchBases = config.get('ldap_search_bases');
    var domain = opts.email.split('@')[1];
    if (!searchBases[domain]) {
      return process.nextTick(function() {
        cb(util.format("unsupported domain: %s", domain));
      });
    }
    opts.dn = util.format("mail=%s,%s", opts.email, searchBases[domain]);
  }

  checkOpts([ 'dn', 'pass' ], opts);

  opts.errorCallback = function(err) {
    cb(err);
  };

  // 1. connect to LDAP server
  createClient(opts, function(err, client) {
    if (err) return cb(err);

    // ensure unbind() is called.
    cb = _.compose(function() {
      client.unbind();
    }, cb);

    // 2. bind as target user
    client.bind(opts.dn, opts.pass, cb);
  });
};

exports.userMayUseEmail = function(opts, cb) {
  // opts.user - canonical user
  // opts.email - possibly an alias

  checkOpts([ 'user', 'email' ], opts);

  // first let's get the canonical address
  exports.canonicalAddress(opts, function(err, canonicalAddress) {
    if (!err && canonicalAddress !== opts.user) {
      err = util.format("%s does not own not %s", opts.user, opts.email);
    }
    cb(err);

    // XXX: add proper revocation checking
    // 1. connect to LDAP server
    // 2. bind as headless user
    // 3. if opts.email != opts.user canonicalize alias
    // 4. if canonical address != opts.user fail!  you don't control this address.
    // 5. if employeeType == disabled, fail
    // 6. return all good
  });
};
