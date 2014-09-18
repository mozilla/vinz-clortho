// vim: shiftwidth=2
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

// preload the binary cert / key files
if (config.get('ldap_server_use_client_cert') == true) {
  var CLIENT_CERT_DATA = fs.readFileSync(config.get('ldap_server_client_cert'));
  var CLIENT_KEY_DATA = fs.readFileSync(config.get('ldap_server_client_key'));
}

// create and connect an LDAP client, populate the options block
function createClient(opts, cb) {
  var connectStartTime = new Date();

  if (typeof opts !== 'object' || opts === null) throw new Error('invalid options parameter');
  opts.url = opts.url || config.get('ldap_server_url');

  opts.use_client_cert      = opts.use_client_cert || config.get('ldap_server_use_client_cert');
  opts.client_cert_file     = opts.use_client_cert_file || config.get('ldap_server_client_cert');
  opts.client_cert_key_file = opts.use_client_cert_key_file || config.get('ldap_server_client_key');

  opts.errorCallback = opts.errorCallback || function(err) {
    logger.warn(util.format('LDAP connection ended with unhandled error: %s', err));
  };

  var connectOpts = {
    url: opts.url,
    connectTimeout: opts.connectTimeout || config.get('ldap_server_connect_timeout')
  };

  if (opts.url.substring(0, 8) == 'ldaps://' && opts.use_client_cert == true) {
    connectOpts.tlsOptions = {
      cert: CLIENT_CERT_DATA,
      key: CLIENT_KEY_DATA
    }
  }

  cb = _.once(cb);

  var client = ldap.createClient(connectOpts);

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
    statsd.timing('ldap.timing.connect', new Date() - connectStartTime);
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

// fetches the user's LDAP entry and returns an
// object with mail, zimbraAlias and employeeType attributes
function getUserData(opts, cb) {

  // required parameters
  checkOpts([ 'email', 'dn', 'pass' ], opts);

  // 'boundClient' is an optional parameter.  When supplied,
  // we will use an existing bound LDAP connection rather than
  // opening a new one.

  // determine the search bases
  var domain = opts.email.split('@')[1];
  var searchBases = config.get('ldap_search_bases')[domain];
  if (!searchBases) {
    process.nextTick(function() {
      cb(util.format("unsupported domain: %s", domain));
    });
    return;
  }

  function withClient(client) {
    /**
     * This hairy bit of code allows us to search multiple
     * base levels of the ldap directory. This exists for several
     * reasons:
     *
     * a) we want to be able to use our mock LDAP server to test with
     *
     * b) our mock ldap server (ldapjs) does not support extensible
     *    filtering, otherwise we could search with this filter:
     *
     *    (&(|(mail='+mail+')(zimbraAlias='+mail+'))(|(o:dn:=org)(o:dn:=com)))
     *
     *    and only need one request to the server
     *
     * c) it is worth the tradeoff(?) of multiple searches, more latency,
     *    more bandwidth and more complex code to have and easily
     *    testable code base.
     *
     * d) it's compatible with Active Directory now ...
     *
     */

    function searchForEmail(searchBase, mail, searchCallback) {
      // no more bases left to search
      if (!searchBase) return searchCallback(null, []);

      client.search(searchBase, {
        scope: 'sub',
        filter: '(|(mail='+opts.email+')(zimbraAlias='+opts.email+'))',
        attributes: ['mail', 'zimbraAlias', 'employeeType', 'pwdChangedTime']
      }, function(err, res) {

        var results = [];

        if (err) {
          logger.warn('error during LDAP search' + err.toString());
          return searchCallback(err, false);
        }

        res.on('searchEntry', function(entry) {
          results.push(entry.object);
        });

        res.on('end', function() {
          if (results.length === 0) {
            searchForEmail(searchBases.shift(), opts.email, searchCallback);
          } else {
            searchCallback(null, results);
          }
        });
      });
    }

    // search searching...
    searchForEmail(searchBases.shift(), opts.email, cb);
  }

  if (opts.boundClient) {
    withClient(opts.boundClient);
  } else {
    createClient(opts, function(err, client) {

      // ensure unbind() is called.
      cb = _.compose(function() {
        client.unbind();
      }, cb);

      client.bind(opts.dn, opts.pass, function(err) {
        if (err) {
          logger.warn("Could not bind to get user data");
          return cb(err, false);
        }

        withClient(client);
      });
    });
  }
}

// convert a (canonical) email address to a DN
exports.convertEmailToDN = function(email) {
  // is this a supported domain?
  var searchBases = config.get('ldap_search_bases');
  var domain = email.split('@')[1];
  if (!searchBases[domain]) {
    throw new Error(util.format("unsupported domain: %s", domain));
  }
  return util.format("mail=%s,%s", email, searchBases[domain][0]);
};

// given an object, add default .dn and .pass if they do not exist
function addDefaultCredentials(opts) {
  if (!opts.dn) {
    opts.dn = config.get('ldap_bind_dn');
    if (opts.pass) throw new Error("providing a password without a DN is meaningless");
    opts.pass = config.get('ldap_bind_password');
  }
}

// given an email, map it to a canonical address
exports.canonicalAddress = function(opts, cb) {
  addDefaultCredentials(opts);
  checkOpts([ 'email', 'dn', 'pass' ], opts);
  getUserData(opts, function(err, results) {
    if (err) return cb(err, false);

    if (results.length !== 0) {
      cb(null, results[0].mail);
    } else {
      err = "Could not find user: " + opts.email;
      logger.warn(err);
      cb(err, false);
    }
  });
};

exports.authUser = function(opts, cb) {
  // opts.email - a user email to authenticate as
  // opts.dn - the dn to authenticate as

  // ensure cb is called only once
  cb = _.once(cb);

  // if email is provided, we assume it is the canonical ldap account and
  // convert it into a bind dn
  if (opts.email) {
    if (opts.dn) throw new Error(".dn and .email are mutually exclusive");
    try {
      opts.dn = exports.convertEmailToDN(opts.email);
    } catch(e) {
      process.nextTick(function() { cb(e); });
      return;
    }
  }

  checkOpts([ 'dn', 'pass' ], opts);

  opts.errorCallback = function(err) {
    cb(err);
  };

  var authStartTime = new Date();

  // 1. connect to LDAP server
  createClient(opts, function(err, client) {
    if (err) return cb(err);

    // ensure unbind() is called.
    cb = _.compose(function() {
      client.unbind();
    }, cb);

    // 2. bind as target user
    client.bind(opts.dn, opts.pass, function(err) {
      statsd.timing('ldap.timing.auth', new Date() - authStartTime);
      if (err) {
        statsd.increment('ldap.auth.wrong_password');
        logger.warn('Wrong credentials for user', opts.dn, err);
        cb(err, false);
      } else {
        statsd.increment('ldap.auth.success');

        /* only fetch extra info. if we are searching by email.
         * this happens only when a user is signing on.
         * I should also note, doing this because getUserData
         * only takes an email address to locate the *right*
         * record in our LDAP directory
         */
        if (opts.email) {
          // fetch some info about the user
          getUserData(opts, function(err, results) {
            if (err) {
              statsd.increment('ldap.auth.fetch_data_error');
              logger.warn("Could not fetch data for user", opts.dn, err);
              cb(err, false);
              return;
            }

            cb(null, {
              email: opts.email,
              zimbraAlias: results[0].zimbraAlias || "",
              pwdChangedTime: results[0].pwdChangedTime || ""
            });
          });
        } else {
          cb(null, {});
        }
      }
    });
  });
};

exports.userMayUseEmail = function(opts, cb) {
  // opts.user - canonical user
  // opts.email - possibly an alias

  addDefaultCredentials(opts);
  checkOpts([ 'user', 'email', 'dn', 'pass' ], opts);

  getUserData(opts, function(err, results) {
    if (err) return cb(err);

    if (results.length === 0) return cb("User not found or disabled");

    if (results[0].mail !== opts.user) {
      return cb(util.format("%s does not own not %s", opts.user, opts.email));
    }

    if (results[0].employeetype === "DISABLED") {
      return cb(util.format("%s account is disabled"), opts.user);
    }

    return cb(null, {
      email: opts.email,
      zimbraAlias: results[0].zimbraAlias || "",
      pwdChangedTime: results[0].pwdChangedTime || ""
    });
  });
};
