#!/usr/bin/env node

const util = require("util"),
      path = require("path"),
      express = require('express');



/**
 * This provides *TWO*, yes *TWO* servers. 
 *
 * 1. the Mock LDAP server that provides some basic 
 *    users for testing
 *
 * 2. a HTTP server that provides an interface for changing
 *    LDAP data and various other tweaks to make Q/A easier
 */

var ldap = require("ldapjs");
var createLdapMock = require("../server/lib/ldapMock");
var ldapMock = createLdapMock();


var fakeLatency = 1;
var LDAP_LISTENING = false;
var ldapServer = null;

function resetServer() {

    if (ldapServer && ldapServer.close) {
        try { ldapServer.close(); } catch (e) {}
    }

    ldapServer = ldap.createServer();
    ldapServer.bind('dc=mozilla', function(req, res, next) {
        if (fakeLatency == -1 ) return;

        setTimeout(function() {
            ldapMock.bindHandler(req, res, next);
        }, fakeLatency);
    });

    ldapServer.search('dc=mozilla', function(req, res, next) {
        if (fakeLatency == -1 ) return;

        setTimeout(function() {
            ldapMock.searchHandler(req, res, next);
        }, fakeLatency)
    });

    ldapServer.on('bind', function(bindEvent) {
        console.log(util.format("Bind Event: Success - %s, dn: %s, credentials: %s", 
                bindEvent.success, bindEvent.dn, bindEvent.credentials));
    });

    ldapServer.on('authorize', function(e) {
        console.log(util.format("Auth %s, dn: %s", (e.success) ? "OK" : "FAIL", e.dn));
    });


    ldapServer.on('listening', function() { 
        console.log("LDAP SERVER LISTENING on port: " + ldapServer.port);
    });

    ldapServer.on('close', function() { 
        LDAP_LISTENING = false;
        console.log("LDAP SERVER STOPPED LISTENING");
    });
}

function startLDAP() {
    if (LDAP_LISTENING == true) {
        return;
    }
    LDAP_LISTENING = true;
    ldapServer.listen(1389, function() {
        ldapServer.emit("listening");
    });
};

resetServer();
startLDAP();

/**
 * HTTP Back-channel server for mucking w/ things ;)
 */
app = express.createServer();
app.use(express.basicAuth('QAUser', 'QAUser'));
app.use(express.bodyParser());
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
});

app.get('/', function(req, res, next) {
    res.render("main", {
        latency: fakeLatency,
        state: LDAP_LISTENING,
        directory: ldapMock.directory
    });
});

app.post('/reset', function(req, res, next) {
    fakeLatency = 1;
    ldapMock = createLdapMock();
    resetServer();
    startLDAP();
    res.redirect('/');
});

// Updates the LDAP database of users
app.post('/update-users', function(req, res, next) { 
    var dir = ldapMock.directory;
    for (email in req.body) {
        for(var i=0; i<dir.length;i++) {
            if (dir[i].attributes.mail == email) {
                dir[i].attributes.password = req.body[email];
            }
        }
    }

    res.redirect('/');
});

// Changes how long the LDAP server will wait to respond
app.post('/set-latency', function(req, res, next) { 
    fakeLatency = parseInt(req.body.latency);
    res.redirect('/');
});

// Sets LDAP state up/down
app.post('/set-state', function(req, res, next) { 
    if (req.body.state == "up") {
        startLDAP();
    } else {
        ldapServer.close();
    }

    res.redirect('/');

});

// resets everything back to defaults
app.post('/reset-all', function(req, res, next) {

});

app.listen('3001', function(err) {
    if (err) {
        console.error("ERROR", err);
    } else {
        console.log("Web Server running on 0.0.0.0:3001")
    }
});




/* Example queries you can run! 

   Get all emails 
   ---------------------
   > ldapsearch -H ldap://localhost:1389 -x \
        -D mail=user@mozilla.com,o=com,dc=mozilla -w testtest \
        -LLL -b "dc=mozilla, o=com" mail=*

   Search by email
   ---------------
   > ldapsearch -H ldap://localhost:1389 -x \
        -D mail=user@mozilla.com,o=com,dc=mozilla -w testtest \
        -LLL -b "dc=mozilla, o=com" mail=user@mozilla.org 

   Bind wrong w/ invalid user
   --------------------------
   > ldapsearch -H ldap://localhost:1389 -x \
        -D cn=not_here,o=com,dc=mozilla -w testtest \
        -LLL -b "dc=mozilla, o=com" mail=user@mozilla.org 

   Bind wrong w/ bad password
   --------------------------
   > ldapsearch -H ldap://localhost:1389 -x \
        -D cn=vinz,o=com,dc=mozilla -w OOPS \
        -LLL -b "dc=mozilla, o=com" mail=user@mozilla.org 

   Don't bind at all
   --------------------------
   > ldapsearch -H ldap://localhost:1389 -x \
        -LLL -b "dc=mozilla, o=com" mail=*

*/
