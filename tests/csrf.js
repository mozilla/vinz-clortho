// start mozilla idp server on an ephemeral port
process.env.PORT = 0;

const
should = require('should'),
clorthoServer = require('../server/bin/clortho'),
request = require('request'),
util = require('util');

var serverURL;

describe('starting up the server', function() {
  it('succeeds', function(done) {
    clorthoServer.startup(function(err, address) {
      should.not.exist(err);
      serverURL = util.format('http://%s:%s', address.address, address.port);
      done();
    });
  });
});

describe("authentication", function() {
  it('should fail without proper csrf token', function(done) {
    request.post(
      util.format('%s/sign_in', serverURL),
      {
        user: 'user1@mozilla.com',
        pass: 'testtest'
      },
      function(err, resp, body) {
        should.not.exist(err);
        (body).should.equal('Forbidden');
        (resp.statusCode).should.equal(403);
        done();
      });
  });
});

// XXX: now we need a reasonable way to extract a csrf token
