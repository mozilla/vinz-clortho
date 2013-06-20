/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// tests of authentication



const
should = require('should'),
request = require('request').defaults({jar: require('request').jar()}),
util = require('util'),
fs = require('fs'),
config = require('../server/lib/configuration');

// let's pre-write an alias file for the purposes of this test

describe('authentication', function() {
  var context;

  // set up alias config before test runs
  before(function() {
    config.set('hardcoded_aliases', {
      'alias3_to_user2@mozilla.com': 'user2@mozilla.com',
      'alias2_to_user2@mozilla.com': 'user2@mozilla.com',
      'alias_to_user2@mozilla.com': 'user2@mozilla.com'
    });
  });

  // clean up alias config after test completes
  after(function() {
    config.set('hardcoded_aliases', {});
  });

  it('servers should start', function(done) {
    var testUtil = require('./lib/test-util');
    testUtil.startServers(function(err, ctx) {
      should.not.exist(err);
      context = ctx;
      done();
    });
  });

  var csrf_token;
  it('csrf can be fetched via the api', function(done) {
    request.get({
      url: util.format('%s/api/session_context', context.mozillaidp.url),
      json: true
    }, function(err, resp, body) {
      should.not.exist(err);
      (body).should.be.a('object');
      (body.csrf).should.be.a('string');
      (resp.headers['cache-control']).should.equal('no-cache, max-age=0');
      csrf_token = body.csrf;
      done();
    });
  });

  it('auth should fail with incorrect password', function(done) {
    request.post({
      url: util.format('%s/api/sign_in', context.mozillaidp.url),
      json: {
        user: 'user2@mozilla.com',
        pass: 'testtestwrong',
        _csrf: csrf_token
      }
    }, function(err, resp, body) {
      should.not.exist(err);
      (resp.statusCode).should.equal(401);
      (body.success).should.equal(false);
      (body.reason).should.equal('email or password incorrect');
      done();
    });
  });

  it('auth should fail with malformed email', function(done) {
    request.post({
      url: util.format('%s/api/sign_in', context.mozillaidp.url),
      json: {
        user: 'user2mozilla.com',
        pass: 'testtest',
        _csrf: csrf_token
      }
    }, function(err, resp, body) {
      should.not.exist(err);
      (resp.statusCode).should.equal(400);
      (body.success).should.equal(false);
      (body.reason).should.equal('user: ValidatorError: Invalid email');
      done();
    });
  });

  it('auth should fail with short password', function(done) {
    request.post({
      url: util.format('%s/api/sign_in', context.mozillaidp.url),
      json: {
        user: 'user2@mozilla.com',
        pass: '12345',
        _csrf: csrf_token
      }
    }, function(err, resp, body) {
      should.not.exist(err);
      (resp.statusCode).should.equal(400);
      (body.success).should.equal(false);
      (body.reason).should.equal('pass: ValidatorError: String is not in range');
      done();
    });
  });

  it('auth should fail with extra arguments', function(done) {
    request.post({
      url: util.format('%s/api/sign_in', context.mozillaidp.url),
      json: {
        user: 'user2@mozilla.com',
        pass: 'testtest',
        _csrf: csrf_token,
        alias: 'user2+foo@mozilla.com',
        email: 'user2+bar@mozilla.com'
      }
    }, function(err, resp, body) {
      should.not.exist(err);
      (resp.statusCode).should.equal(400);
      (body.success).should.equal(false);
      (body.reason).should.equal("unsupported parameter: 'alias', 'email'");
      done();
    });
  });

  it('auth should succeed when correct', function(done) {
    request.post({
      url: util.format('%s/api/sign_in', context.mozillaidp.url),
      json: {
        user: 'user2@mozilla.com',
        pass: 'testtest',
        _csrf: csrf_token
      }
    }, function(err, resp, body) {
      should.not.exist(err);
      (resp.statusCode).should.equal(200);
      done();
    });
  });

  it('aliased user should authenticate', function(done) {
    request.post({
      url: util.format('%s/api/sign_in', context.mozillaidp.url),
      json: {
        user: 'alias_to_user2@mozilla.com',
        pass: 'testtest',
        _csrf: csrf_token,
      }
    }, function(err, resp, body) {
      should.not.exist(err);
      (resp.statusCode).should.equal(200);
      done();
    });
  });
});
