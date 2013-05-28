/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// tests of static file serving

const
should = require('should'),
testUtil = require('./lib/test-util'),
request = require('request'),
util = require('util'),
config = require('../server/lib/configuration');

// explicitly disable development mode to test STS headers
config.set('local_development', false);

var securityPolicyValue = util.format("default-src 'self' %s",
                                     config.get('browserid_server'));
var serverURL;

describe('static file serving', function() {
  it('the server should startup', function(done) {
    testUtil.startServers(function(err, context) {
      should.not.exist(err);
      serverURL = context.mozillaidp.url;
      done();
    });
  });

  var signInPath, provisioningPath;

  it('should respond to requests on .well-known/browserid', function(done) {
    request(
      util.format('%s/.well-known/browserid', serverURL),
      function(err, resp, body) {
        should.not.exist(err);
        should.exist(body);
        var parsed = JSON.parse(body);
        // content type is important, part of the protocol
        (resp.headers['content-type']).should.equal('application/json');

        // cache headers are important, controls how long verifiers can cache the public key
        (resp.headers['cache-control']).should.equal('max-age=5, public');

        // we use STS everywhere
        (resp.headers['strict-transport-security']).should.equal("max-age=10886400; includeSubdomains");

        should.exist(parsed.authentication);
        signInPath = parsed.authentication
        should.exist(parsed.provisioning);
        provisioningPath = parsed.provisioning;
        should.exist(parsed['public-key']);
        done();
      });
  });

  it('should serve provisioning page', function(done) {
    request(
      util.format('%s%s', serverURL, provisioningPath),
      function(err, resp, body) {
        should.not.exist(err);
        should.exist(body);
        (resp.headers['content-type']).should.equal('text/html; charset=utf-8');
        (resp.headers['strict-transport-security']).should.equal("max-age=10886400; includeSubdomains");
        (resp.headers['x-content-security-policy']).should.equal(
          securityPolicyValue);
        done();
      });
  });

  it('should serve authenticate page', function(done) {
    request(
      util.format('%s%s', serverURL, signInPath),
      function(err, resp, body) {
        should.not.exist(err);
        should.exist(body);
        (resp.headers['content-type']).should.equal('text/html; charset=utf-8');
        (resp.headers['x-frame-options']).should.equal('DENY');
        (resp.headers['strict-transport-security']).should.equal("max-age=10886400; includeSubdomains");
        (resp.headers['x-content-security-policy']).should.equal(
          securityPolicyValue);

        done();
      });
  });
});
