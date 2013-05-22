/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const ldap = require('ldapjs'),
    config = require('./configuration'),
    logger = require('./logging').logger,
    statsd = require('../lib/statsd');

// check required configuration at startup
[ 'ldap_server_url', 'ldap_bind_dn', 'ldap_bind_password' ].forEach(function(k) {
  if (!config.has(k)) {
    logger.error(util.format("Configuration error, you must specifiy '%s'", k));
    process.exit(1);
  }
});

function connectAndBind(opts, cb) {
  opts.url = opts.url || config.get('ldap_server_url');
  opts.dn = opts.dn || config.get('ldap_bind_dn');
  opts.bindPassword = opts.bindPassword || config.get('ldap_bind_password');
  var connectTimeout = opts.connectTimeout || config.get('ldap_server_connect_timeout')

  var client = ldap.createClient({
    url: opts.url,
    connectTimeout: connectTimeout
  });


  client.on('close', function(err) {
    if (err) {
      if (cb) {
        cb(err);
        cb = null;
      } else {
        logger.debug(util.format('LDAP connection closed%s', err ? " with an error" : ""));
      }
    }
  });
  client.on('error', function(err) {
    // count errors during connect
    statsd.increment('ldap.error.connect');
    if (err) {
      logger.warn('LDAP connection errored:', err);
      if (cb) {
        cb(err);
        cb = null;
      }
    }
  });

  client.bind(
    opts.dn,
    opts.bindPassword,
    function(err) {
      // count errors during bind (would indicate an error with connect
      if (err) statsd.increment('ldap.error.bind');
      client.removeAllListeners('close');
      client.removeAllListeners('error');
      logger.warn('Unable to bind to LDAP as', opts.dn, err);
      if (cb) {
        cb(err, client);
        cb = null;
      }
    }
  );
}

/* check if we can authenticate to an ldap server. arguments include:
 *          url: url to LDAP server
 *           dn: LDAP distinguished name to bind
 * bindPassword: credentials associated with DN
 */
exports.checkBindAuth = function(opts, cb) {
  if (typeof opts === 'function' && !cb) {
    cb = opts;
    opts = {};
  }
  connectAndBind(opts, function(err, client) {
    if (!err && client) client.unbind();
    cb(err, !err);
  });
};

/*
 * Authenticate a user to LDAP provided an email and the user's LDAP password.
 * This performs the following:
 *  1. binds to LDAP using known credentials
 *  2. searches for the email address the user entered (to support aliases)
 *  3. re-binds as the target user and provided password
 *
 * The following arguments are accepted:
 *          url: url to LDAP server
 *           dn: LDAP distinguished name to bind (used in #1)
 * bindPassword: credentials associated with DN (used in #1)
 *        email: the user's email address (or alias) (used in #2)
 *     password: the user's LDAP password
 */
exports.authEmail = function(opts, authCallback) {
  if (!opts) throw "argument required";
  if (!opts.password) throw "email address required";
  if (!opts.email) throw "email address required";

  var start = new Date();
  connectAndBind(opts, function(err, client) {
    // report time required to connect and bind to ldap.
    statsd.timing('ldap.timing.bind', new Date() - start);
    if (err) {
      return authCallback(err);
    }
    // the bind connection was successful!  ensure we unbind() before
    // returning to not leave stale connections about.
    var callback = function() {
      try {
        client.unbind();
      } catch(e) {
        logger.warn('failed to unbind LDAP connection', e);
      }
      if (authCallback) {
        authCallback.apply(null, arguments);
        authCallback = null;
      }
    };

    // ensure callback called if the connection drops
    client.on('close', function(err) {
      if (err) {
        if (callback) {
          callback(err);
          callback = null;
        } else {
          logger.debug(util.format('LDAP connection closed after initial bind%s', err ? " with an error" : ""));
        }
      }
    });
    client.on('error', function(err) {
      if (err) {
        logger.warn('LDAP connection errored after successful initial bind:', err);
        if (callback) {
          callback(err);
          callback = null;
        }
      }
    });

    var results = 0;

    start = new Date();
    client.search('o=com,dc=mozilla', {
      scope: 'sub',
      filter: '(|(mail=' + opts.email + ')(emailAlias=' + opts.email + '))',
      attributes: ['mail']
    }, function (err, res) {
      var bindDN;

      // total time required to connect, bind, and then search for an
      // alias
      statsd.timing('ldap.timing.search', new Date() - start);
      if (err) {
        statsd.increment('ldap.error.search');
        logger.warn('error during LDAP search ' + err.toString());
        return callback(err, false);
      }

      res.on('searchEntry', function(entry) {
        bindDN = entry.dn;
        results++;
      });

      res.on('end', function () {
        if (results == 1) {
          start = new Date();
          client.bind(bindDN, opts.password, function (err) {
            // report total time required to connect, bind, search, and
            // bind as target user
            statsd.timing('ldap.timing.bind_as_user', new Date() - start);
            if (err) {
              statsd.increment('ldap.auth.wrong_password');
              logger.warn('Wrong credentials for user', bindDN, err);
              callback(err, false);
            } else {
              statsd.increment('ldap.auth.success');
              // Successful LDAP authentication
              callback(null, true);
            }
          });
        } else {
          callback(null, false);
        }
      });
    });
  });
};


