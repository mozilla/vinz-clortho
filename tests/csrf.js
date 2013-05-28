// start mozilla idp server on an ephemeral port
const
should = require('should'),
request = require('request'),
util = require('util'),
testUtil = require('./lib/test-util');

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

describe("authentication", function() {
  it('should fail without proper csrf token', function(done) {
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

describe("authentication", function() {
  it('should succeed with proper csrf token', function(done) {
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
