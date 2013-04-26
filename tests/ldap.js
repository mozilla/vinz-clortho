const
should = require('should'),
ldapMock = require('../server/lib/ldapMock'),
ldap = require('ldapjs'),
auth = require('../server/lib/auth.js'),
testUtil = require('./lib/test-util.js');

var ldapServerInstance = null;

describe('binding to the ldap server via our library', function() {

  before(function(done) {
      ldapServerInstance = ldapMock.server;
      ldapServerInstance.listen(65077, '127.0.0.1', done);
  });

  it('should fail with an unbound port', function(done) {
    auth.checkBindAuth({
      url: 'ldap://127.0.0.10:777',
      dn: 'o=example',
      bindPassword: 'secret'
    }, function(err) {
      should.exist(err);
      (err.message).should.equal("connect ECONNREFUSED");
      done();
    });
  });

  it('should fail with a bogus ip', function(done) {
    auth.checkBindAuth({
      url: 'ldap://192.192.192.192:777',
      dn: 'o=example',
      bindPassword: 'secret',
      connectTimeout: 30 /* ms */
    }, function(err) {
      should.exist(err);
      (err.message).should.equal("ldap://192.192.192.192:777 closed");
      done();
    });
  });

  it('should fail with incorrect username', function(done) {
    auth.checkBindAuth({
      url: ldapServerInstance.url,
      dn: 'o=badexample',
      bindPassword: 'secret'
    }, function(err) {
      should.exist(err);
      (err.message).should.equal("No tree found for: o=badexample");
      done();
    });
  });

  it('should succeed when params are correct', function(done) {
    auth.checkBindAuth({
      url: ldapServerInstance.url,
      dn: 'mail=user@mozilla.com, o=com, dc=mozilla',
      bindPassword: 'testtest'
    }, function(err) {
      should.not.exist(err);
      done();
    });
  });
});
