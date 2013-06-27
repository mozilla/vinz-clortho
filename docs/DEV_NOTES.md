# Developer Notes

## Running locally

### Set up Configuration

copy server/config/local.json-dist to local.json and edit a few fields:

     ...
     "ldap_bind_dn": "mail=USERNAME@mozilla.com,o=com,dc=mozilla",
     ...
     "ldap_server_url": "ldap://localhost:1389",
     ...

### Starting the Mock LDAP server

    $ QAUser=test QAPass=test node mock-ldap-server/server.js

This mock server runs LDAP on localhost:1389 and a status HTTP server on localhost:3001.

### Starting Vinz Clortho
    
    $ PORT=3002 ADDRESS=0.0.0.0 npm start

### One Time Setup

We need our well-known to be on the file system. You can put this anywhere, but we'll use this when starting BrowserID servers.

    $ curl http://localhost:3002/.well-known/browserid > [LOCAL_PATH_TO_WELL_KNOWN_FILE]

### Starting BrowserID

In your local browserid, set `SHIMMED_PRIMARIES`. Example:

    $ cd ../browserid
    $ SHIMMED_PRIMARIES="mozilla.com|http://127.0.0.1:3002|[LOCAL_PATH_TO_WELL_KNOWN_FILE]" npm start

You can now use `user1@mozilla.com` with password testtest and Vinz Clortho will handle the sign in flow.

Note: 127.0.0.1 should be an IP address that your web browser can use to hit your instance of Vinz Clortho. If your using VMs, then make it an IP for the VM.