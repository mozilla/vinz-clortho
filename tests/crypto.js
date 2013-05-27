/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// tests of crypto routines of the server

const
should = require('should'),
testUtil = require('./lib/test-util'),
request = require('request'),
jwcrypto = require('jwcrypto');

// load desired algorithms
require("jwcrypto/lib/algs/rs");
require("jwcrypto/lib/algs/ds");

var serverURL;

describe('the server', function() {
  it('should start', function(done) {
    testUtil.startServers(function(err, ctx) {
      should.not.exist(err);
      serverURL = ctx.mozillaidp.url;
      done();
    });
  });

  it('should respond serve a valid public key in .well-known/browserid', function(done) {
    request(
      util.format('%s/.well-known/browserid', serverURL),
      function(err, resp, body) {
        should.not.exist(err);
        should.exist(body);
        var parsed = JSON.parse(body);
        should.exist(parsed['public-key']);
        // now let's parse the public key
        var key;
        (function() {
          key = jwcrypto.loadPublicKey(JSON.stringify(parsed['public-key']));
        }).should.not.throw();
        should.exist(key);
        done();
      });
  });
});
