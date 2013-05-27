/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// tests of authentication throttling

const
should = require('should'),
request = require('request'),
util = require('util'),
testUtil = require('./lib/test-util'),
config = require('../server/lib/configuration');

var context;

describe('starting up the servers', function() {
  it('succeeds', function(done) {
    testUtil.startServers(function(err, ctx) {
      should.not.exist(err);
      context = ctx;
      done();
    });
  });
});

var csrf_token;
describe('CSRF token', function() {
  it('can be fetched via the api', function(done) {
    request.get({
      url: util.format('%s/api/session_context', context.mozillaidp.url),
      json: true
    }, function(err, resp, body) {
      should.not.exist(err);
      (body).should.be.a('object');
      (body.csrf).should.be.a('string');
      csrf_token = body.csrf;
      done();
    });
  });
});

function authNTimes(n, password, cb, _lastErr) {
  if (n === 0) return cb(_lastErr);
  request.post({
    url: util.format('%s/sign_in', context.mozillaidp.url),
    json: {
      user: 'user2@mozilla.com',
      pass: password,
      _csrf: csrf_token
    }
  }, function(err, resp, body) {
    var curErr;
    switch (resp.statusCode) {
    case 200: curErr = null; break;
    case 403: curErr = 'throttled'; break;
    case 401: curErr = 'failed'; break;
    };
    authNTimes(--n, password, cb, err || curErr);
  });
}

describe("authentication", function() {
  it('should succeed 5 times', function(done) {
    authNTimes(5, "testtest", done);
  });

  it('should fail 4 times', function(done) {
    authNTimes(4, "badpassword", function(err) {
      (err).should.equal('failed');
      done();
    });
  });

  it('should succeed on the fifth', function(done) {
    authNTimes(1, "testtest", done);
  });

  it('should fail 5 times', function(done) {
    authNTimes(5, "badpassword", function(err) {
      (err).should.equal('failed');
      done();
    });
  });

  it('should result in a locked out user', function(done) {
    authNTimes(1, "testtest", function(err) {
      done(err === 'throttled' ? null : "failed to throttle");
    });
  });

  it('should succeed again after auth_lockout_ms expires', function(done) {
    config.set('auth_lockout_ms', 10);
    setTimeout(function() {
      authNTimes(1, "testtest", done);
    }, 20);
  });
});
