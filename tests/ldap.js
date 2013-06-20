/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Tests of our ldap abstraction against a local node.js LDAP server

const
should = require('should'),
ldapMock = require('../server/lib/ldapMock')(),
ldap = require('ldapjs'),
auth = require('../server/lib/auth.js'),
testUtil = require('./lib/test-util.js');

var ldapServerInstance = null;

describe('the LDAP authentication library', function() {
  before(function(done) {
      ldapServerInstance = ldapMock.server;
    ldapServerInstance.listen(65077, '127.0.0.1', done);
  });

  it('should throw when required parameters are missing', function(done) {
    (function() {
      auth.authUser({
        url: 'ldap://127.0.0.1:777',
        pass: 'secret'
      }, null);
    }).should.throw("missing required parameters: dn");
    done();
  });

  it('should fail with an unbound port', function(done) {
    auth.authUser({
      url: 'ldap://127.0.0.1:777',
      dn: 'o=example',
      pass: 'secret'
    }, function(err) {
      should.exist(err);
      (err.message).should.equal("connect ECONNREFUSED");
      done();
    });
  });

  it('should fail with a bogus ip', function(done) {
    auth.authUser({
      url: 'ldap://192.192.192.192:777',
      dn: 'o=example',
      pass: 'secret',
      connectTimeout: 30 // ms
    }, function(err) {
      should.exist(err);
      (err).should.equal("connect failed");
      done();
    });
  });

  it('should fail with incorrect username', function(done) {
    auth.authUser({
      url: ldapServerInstance.url,
      dn: 'o=badexample',
      pass: 'secret'
    }, function(err) {
      should.exist(err);
      (err.message).should.equal("No tree found for: o=badexample");
      done();
    });
  });

  it('should succeed when params are correct', function(done) {
    auth.authUser({
      url: ldapServerInstance.url,
      dn: 'mail=user1@mozilla.com, o=com, dc=mozilla',
      pass: 'testtest'
    }, function(err) {
      should.not.exist(err);
      done();
    });
  });
});
