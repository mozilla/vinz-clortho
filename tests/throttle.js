/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// tests of authentication throttling

const
should = require('should'),
request = require('request').defaults({jar: require('request').jar()}),
util = require('util'),
testUtil = require('./lib/test-util'),
config = require('../server/lib/configuration');

describe('authentication throttling', function() {
  var context;
  function authNTimes(n, password, cb, _lastErr) {
    if (n === 0) return cb(_lastErr);
    request.post({
      url: util.format('%s/api/sign_in', context.mozillaidp.url),
      json: {
        user: 'user2@mozilla.com',
        pass: password,
        _csrf: csrf_token
      }
    }, function(err, resp, body) {
      var curErr = resp.statusCode === 200 ? null : 'failed';
      authNTimes(--n, password, cb, err || curErr);
    });
  }

  it('servers startup as expected', function(done) {
    testUtil.startServers(function(err, ctx) {
      should.not.exist(err);
      context = ctx;
      done();
    });
  });

  var csrf_token;
  it('a CSRF token can be fetched', function(done) {
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

  it('auth will succeed 5 consecutive times', function(done) {
    authNTimes(5, "testtest", done);
  });

  it('auth may fail 4 consecutive times', function(done) {
    authNTimes(4, "badpassword", function(err) {
      (err).should.equal('failed');
      done();
    });
  });

  it('auth should succeed on the fifth', function(done) {
    authNTimes(1, "testtest", done);
  });

  it('auth may fail 5 consecutive times', function(done) {
    authNTimes(5, "badpassword", function(err) {
      (err).should.equal('failed');
      done();
    });
  });

  it('which results in a locked out user', function(done) {
    authNTimes(1, "testtest", function(err) {
      done(err === 'failed' ? null : "failed to throttle");
    });
  });

  it('user is locked out with a bad password', function(done) {
    authNTimes(1, "bad password", function(err) {
      done(err === 'failed' ? null : "failed to throttle");
    });
  });

  it('user is able to login after auth_lockout_ms expires', function(done) {
    config.set('auth_lockout_ms', 10);
    setTimeout(function() {
      authNTimes(1, "testtest", done);
    }, 20);
  });
});
