const
should = require('should'),
ldapServer = require('./lib/ldap-server.js'),
ldap = require('ldapjs'),
auth = require('../server/lib/auth.js'),
testUtil = require('./lib/test-util.js');

var ldapServerInstance;

describe('creating an ldap server', function() {
  it('should succeed', function(done) {
    ldapServer.create(function(err, server) {
      should.not.exist(err);
      (server).should.not.equal(null);
      (server.url).should.not.equal(null);
      ldapServerInstance = server;
      done();
    })
  });

  it('should respond to a basic query', function(done) {
    var client = ldap.createClient({
      url: ldapServerInstance.url
    });
    client.search('o=example', {}, function(err) {
      should.not.exist(err);
      done();
    });
  });
})

describe('binding to the ldap server via our library', function() {
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
      dn: 'o=example',
      bindPassword: 'secret'
    }, function(err) {
      should.not.exist(err);
      done();
    });
  });
});
