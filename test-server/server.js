#!/usr/bin/env node

const util = require("util")

/**
 * This just starts our mock ldap server on the default port 
 */

ldapMock = require("../server/lib/ldapMock");

ldapMock.server.on('bind', function(bindEvent) {
    console.log(util.format("Bind Event: Success - %s, dn: %s, credentials: %s", 
            bindEvent.success, bindEvent.dn, bindEvent.credentials));
});

ldapMock.server.on('authorize', function(e) {
    console.log(util.format("Auth %s, dn: %s", (e.success) ? "OK" : "FAIL", e.dn));
});

ldapMock.server.listen(1389, function() {
    console.log("Directory Entries: ", JSON.stringify(ldapMock.directory, null, "    "));
    console.log("Listening on port 1389");
});

/* Example queries you can run! 

   Get all emails 
   ---------------------
   > ldapsearch -H ldap://localhost:1389 -x \
        -D mail=user@mozilla.com,dc=mozilla,o=com -w test \
        -LLL -b "dc=mozilla, o=com" mail=*

   Search by email
   ---------------
   > ldapsearch -H ldap://localhost:1389 -x \
        -D mail=user@mozilla.com,dc=mozilla,o=com -w test \
        -LLL -b "dc=mozilla, o=com" mail=user@mozilla.org 

   Bind wrong w/ invalid user
   --------------------------
   > ldapsearch -H ldap://localhost:1389 -x \
        -D cn=not_here,dc=mozilla,o=com -w test \
        -LLL -b "dc=mozilla, o=com" mail=user@mozilla.org 

   Bind wrong w/ bad password
   --------------------------
   > ldapsearch -H ldap://localhost:1389 -x \
        -D cn=vinz,dc=mozilla,o=com -w OOPS \
        -LLL -b "dc=mozilla, o=com" mail=user@mozilla.org 

   Don't bind at all
   --------------------------
   > ldapsearch -H ldap://localhost:1389 -x \
        -LLL -b "dc=mozilla, o=com" mail=*

*/
