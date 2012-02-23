var ldap = require('ldapjs');

exports.auth = function (opts) {
  console.log(opts);
  if (! opts.ldap_server_url) throw "Configuration error, you must specifiy an ldap_server_url";
  if (! opts.ldap_bind_dn) throw "Configuration error, you must specifiy a ldap_bind_dn";
  if (! opts.ldap_bind_password) throw "Configuration error, you must specifiy a ldap_bind_password";

  return {

    /**
     * Authenticate with the Mozilla LDAP server.
     *
     * @method bind
     * @param {string} email - mozilla.com email address
     * @param {string} password - password to use.
     * @param {function} [callback] - callback to call when complete.  Will be 
     * called with one parameter - err.  err will be null if successful, an object 
     * otw.
     */
    login: function(email, password, callback) {
      console.log(email.indexOf('@mozilla.com'));
      if (email.indexOf('@mozilla.com') === -1) {
        throw "Invalid ASSERTION, authenticating non mozilla.com email address:" + email;
      }
      console.log('creating client');
      var client = ldap.createClient({
        url: opts.ldap_server_url
      });
      var results = 0;
      client.bind(opts.ldap_bind_dn, opts.ldap_bind_password, function(err) {
      console.log('system bind');
        if (err) {
          console.log('NOAUTH', err);
          console.log('Unable to bind to LDAP to search for DNs');
          return callback(err, false);
        } else {
          console.log('SYS LOGIN SUCCESSFUL');
          client.search('o=com,dc=mozilla', {
            scope: 'sub',
            filter: '(|(mail=' + email + ')(emailAlias=' + email + '))',
            attributes: ['mail']
          }, function (err, res) {
            console.log('searching err', err);
            console.log('searching res', res);
            if (err) {
              console.log('error on serach');
              return callback(err, false);
            }
            res.on('searchEntry', function(entry) {
              console.log('got a result');
              bindDN = entry.dn;
              results++;
            });
            res.on('end', function () {
             console.log('finished');
              if (results == 1) {
                client.bind(bindDN, password, function (err) {
                  if (err) {
                    console.log('Wrong username or password');
                    callback(err, false);
                  } else {
                    console.log('It\'s all good');
                    callback(null, true);
                  }
                });
              } else {
                console.log('Wrong username... found ', results, ' entries');
                callback(err, false);
              }
            });
        });
      }
      });
    }
  };
};

