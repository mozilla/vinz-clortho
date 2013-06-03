const 
    clorthoServer = require('../server/bin/clortho'),
    should = require('should'),
    request = require('request').defaults({jar: require('request').jar()}),
    util = require('util'),
    config = require('../server/lib/configuration');

describe('Health Checking', function() {
    var serverURL = "";

    before(function() {
    });

    it('the server should startup', function(done) {
        clorthoServer.startup(function(err, address){
            should.not.exist(err);
            serverURL = "http://" + address.address + ":" + address.port;
            done();
        });
    });

    it('should return 200 on node_status', function(done) {
        request(
            util.format('%s%s', serverURL, "/node_status"), 
            function(err, resp, body) {
                resp.statusCode.should.equal(200);
                body.should.equal("OK");
                done();
            }
        );
    });

    it('should return 200 on ldap_status OK', function(done) {
        request(
            util.format('%s%s', serverURL, "/ldap_status"), 
            function(err, resp, body) {
                resp.statusCode.should.equal(200);
                resp.body.should.equal("OK");
                done();
            }
        );
    });

    it('should return 503 on ldap_status error', function(done) {
        // fml, side effects, we need this so when attempting to 
        // bind it will look for an ldap server that doesn't exist
        var ldapurl   = config.get("ldap_server_url");
        config.set('ldap_server_url', 'ldap://127.0.0.1:1');
        request(
            util.format('%s%s', serverURL, "/ldap_status"), 
            function(err, resp, body) {
                resp.statusCode.should.equal(503);
                config.set('ldap_server_url', ldapurl);
                done();
            }
        );
    });
    
    it('should return 503 on ldap_status invalid password', function(done) {
        // fml, side effects, we need this so when attempting to 
        // bind it will look for an ldap server that doesn't exist
        var tmp = config.get("ldap_bind_password");
        config.set('ldap_bind_password', 'fakkkkkkkkkkeeeee!');
        request(
            util.format('%s%s', serverURL, "/ldap_status"), 
            function(err, resp, body) {
                resp.statusCode.should.equal(503);
                resp.body.should.equal("Error: InvalidCredentialsError");
                config.set('ldap_bind_password', tmp);
                done();
            }
        );
    });

    it('should return 503 on ldap_status invalid DN', function(done) {
        // fml, side effects, we need this so when attempting to 
        // bind it will look for an ldap server that doesn't exist
        var tmp = config.get("ldap_bind_dn");
        config.set('ldap_bind_dn', 'o=notin,com=thetree');
        request(
            util.format('%s%s', serverURL, "/ldap_status"), 
            function(err, resp, body) {
                resp.statusCode.should.equal(503);
                resp.body.should.equal("Error: NoSuchObjectError");
                config.set('ldap_bind_dn', tmp);
                done();
            }
        );
    });

});

