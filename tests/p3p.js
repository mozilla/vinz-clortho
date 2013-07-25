const
should = require('should'),
request = require('request').defaults({jar: require('request').jar()}),
util = require('util'),
fs = require('fs'),
config = require('../server/lib/configuration');

// let's pre-write an alias file for the purposes of this test

describe('P3P Header', function() {
  var context;

  it('servers should start', function(done) {
    var testUtil = require('./lib/test-util');
    testUtil.startServers(function(err, ctx) {
      should.not.exist(err);
      context = ctx;
      done();
    });
  });

  it('P3P headers should be set when IE User-Agent is sent', function(done) {
    request.get({
      url: util.format('%s/api/session_context', context.mozillaidp.url),
      json: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0; GTB7.4; InfoPath.2; SV1; .NET CLR 3.3.69573; WOW64; en-US)'
      }
    }, function(err, resp, body) {
      should.not.exist(err);
      should.exist(resp.headers['p3p'])
      done();
    });
  });

  it('P3P headers should NOT set by default', function(done) {
    request.get({
      url: util.format('%s/api/session_context', context.mozillaidp.url),
      json: true,
    }, function(err, resp, body) {
      should.not.exist(err);
      should.not.exist(resp.headers['p3p'])
      done();
    });
  });
});
