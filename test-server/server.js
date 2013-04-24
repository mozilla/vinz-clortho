#!/usr/bin/env node

/**
 * This just starts our mock ldap server on the default port 
 */

ldapMock = require("../server/lib/ldapMock")
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
