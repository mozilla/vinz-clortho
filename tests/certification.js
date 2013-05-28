/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// tests of certificate signing

const
should = require('should'),
request = require('request'),
util = require('util'),
testUtil = require('./lib/test-util'),
crypto = require('../server/lib/crypto'),
config = require('../server/lib/configuration'),
jwcrypto = require('jwcrypto');

// load desired algorithms
require("jwcrypto/lib/algs/rs");
require("jwcrypto/lib/algs/ds");

describe('certificate signing', function() {
  var context;

  it('servers should start', function(done) {
    testUtil.startServers(function(err, ctx) {
      should.not.exist(err);
      context = ctx;
      done();
    });
  });

  var keypair;
  it('client side keypair generation succeeds', function(done) {
    jwcrypto.generateKeypair(
      {algorithm: 'DS', keysize: 128},
      function(err, kp) {
        should.not.exist(err);
        keypair = kp;
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

  it('signing request fails without proper CSRF', function(done) {
    request.post({
      url: util.format('%s/provision', context.mozillaidp.url),
      json: {
        pubkey: keypair.publicKey.serialize()
      }
    }, function(err, resp, body) {
      should.not.exist(err);
      // 403 returned when CSRF is missing
      (resp.statusCode).should.equal(403);
      done();
    });
  });

  it('signing request fails without an authenticated session', function(done) {
    request.post({
      url: util.format('%s/provision', context.mozillaidp.url),
      json: {
        pubkey: keypair.publicKey.serialize(),
        _csrf: csrf_token
      }
    }, function(err, resp, body) {
      should.not.exist(err);
      // 401 returned when authentication is missing
      (resp.statusCode).should.equal(401);
      done();
    });
  });

  it('authentication should succeed', function(done) {
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

  it('signing request succeeds with an authenticated session', function(done) {
    request.post({
      url: util.format('%s/provision', context.mozillaidp.url),
      json: {
        pubkey: keypair.publicKey.serialize(),
        _csrf: csrf_token
      }
    }, function(err, resp, body) {
      should.not.exist(err);
      (resp.statusCode).should.equal(200);
      var serverPubKey = jwcrypto.loadPublicKey(crypto.pubKey);
      jwcrypto.verify(body.cert, serverPubKey, function(err, payload) {
        should.not.exist(err);
        (payload.iss).should.equal(config.get('issuer'));
        // convert units (s -> ms) and add 10 second padding (certificates are issued
        // 10s in the past to mitigate minor clock skew)
        (payload.exp - payload.iat).should.equal((config.get('certificate_validity_s') + 10) * 1000);
        (payload.iss).should.equal('mozilla.personatest.org');
        (payload.principal.email).should.equal('user2@mozilla.com');
        done();
      });
    });
  });
});
