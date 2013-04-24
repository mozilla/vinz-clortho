/* tests of static file serving */

// start server on an ephemeral port
process.env['PORT'] = 0;

const
should = require('should'),
clorthoServer = require('../server/bin/clortho'),
request = require('request');

var serverURL;

describe('starting up the server', function() {
  it('should succeed', function(done) {
    clorthoServer.startup(function(err, address) {
      should.not.exist(err);
      serverURL = util.format('http://%s:%s', address.address, address.port);
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
      util.format('%s/%s', serverURL, provisioningPath),
      function(err, resp, body) {
        should.not.exist(err);
        should.exist(body);
        (resp.headers['content-type']).should.equal('text/html; charset=utf-8');
        done();
      });
  });

  it('should serve authenticate page', function(done) {
    request(
      util.format('%s/%s', serverURL, signInPath),
      function(err, resp, body) {
        should.not.exist(err);
        should.exist(body);
        (resp.headers['content-type']).should.equal('text/html; charset=utf-8');
        done();
      });
  });

});
