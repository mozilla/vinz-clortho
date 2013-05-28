/* a home for utilities common to all tests. */

// disable logging for tests when VERBOSE isn't defined in the env
if (!process.env['VERBOSE']) {
  (require('../../server/lib/logging.js')).disable();
}

const
clorthoServer = require('../../server/bin/clortho'),
config = require('../../server/lib/configuration'),
ldapMock = require('../../server/lib/ldapMock')();

// nothing to export right now!
module.exports = {
  // start local LDAP server and mozilla IdP bound to ephemeral ports
  startServers: function(cb) {
    var ctx = {
      mozillaidp: {
        url: ''
      },
      ldap: {
        url: '',
        instance: null
      }
    };
    // set configuration for ldap server
    config.set('ldap_bind_dn', 'mail=user1@mozilla.com, o=com, dc=mozilla');
    config.set('ldap_bind_password', 'testtest');
    ctx.ldap.instance = ldapMock.server;
    ctx.ldap.instance.listen(0, '127.0.0.1', function(err, x) {
      if (err) return cb(err);
      ctx.ldap.url = ctx.ldap.instance.url;
      config.set('ldap_server_url', ctx.ldap.url);
      clorthoServer.startup(function(err, address) {
        if (err) return cb(err);
        ctx.mozillaidp.url = util.format('http://%s:%s',
                                         address.address,
                                         address.port);
        cb(null, ctx);
      });
    });
  }
};
