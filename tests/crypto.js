/* tests of static file serving */

// start server on an ephemeral port
process.env['PORT'] = 0;

const
should = require('should'),
clorthoServer = require('../server/bin/clortho'),
request = require('request'),
jwcrypto = require('jwcrypto');

// load desired algorithms
require("jwcrypto/lib/algs/rs");
require("jwcrypto/lib/algs/ds");

var serverURL;

describe('starting up the server', function() {
  it('should succeed', function(done) {
    clorthoServer.startup(function(err, address) {
      should.not.exist(err);
      serverURL = util.format('http://%s:%s', address.address, address.port);
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
