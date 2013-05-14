# Developer Notes

## Running locally

### Starting Vinz Clortho
    
    $ PORT=3001 ADDRESS=0.0.0.0 npm start

### One Time Setup

We need our well-known to be on the file system. You can put this anywhere, but we'll use this when starting BrowserID servers.

    $ curl http://localhost:3001/.well-known/browserid > /home/ozten/vinz-clortho/well-known-browserid

### Starting BrowserID

In your local browserid, set `SHIMMED_PRIMARIES`. Example:

    $ cd ../browserid
    $ SHIMMED_PRIMARIES="dev.login.mozilla.org|http://127.0.0.1:3001|/home/ozten/vinz-clortho/well-known-browserid" npm start

You can now use `username@dev.login.mozilla.org` and Vinz Clortho will handle the sign in flow.

Note: 127.0.0.1 should be an IP address that your web browser can use to hit your instance of Vinz Clortho. If your using VMs, then make it an IP for the VM.