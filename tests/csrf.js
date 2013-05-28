/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// tests of CSRF protection

const
should = require('should'),
request = require('request'),
util = require('util'),
testUtil = require('./lib/test-util');


describe('CSRF checking', function() {
  var context;

  it('servers should start', function(done) {
    testUtil.startServers(function(err, ctx) {
      should.not.exist(err);
      context = ctx;
      done();
    });
  });

  it('auth should fail without proper token', function(done) {
    request.post({
      url: util.format('%s/sign_in', context.mozillaidp.url),
      json: {
        user: 'user2@mozilla.com',
        pass: 'testtest',
      }
    }, function(err, resp, body) {
      should.not.exist(err);
      (body).should.equal('Forbidden');
      (resp.statusCode).should.equal(403);
      done();
    });
  });

  var csrf_token;
  it('token can be fetched via the api', function(done) {
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

  it('auth should succeed with proper token', function(done) {
    request.post({
      url: util.format('%s/sign_in', context.mozillaidp.url),
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
});
