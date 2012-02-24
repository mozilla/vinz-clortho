# Developer Notes #
## Setup ##

Add a local domain name to your /etc/hosts file or deploy to a server. Localhost won't work with jschannel stuff.

Copy etc/config.js-dist to etc/config.js and add your LDAP username and LDAP password, so the server can bind as you. In production, this will be replaced with a "bind user", but you can serve that role in development.

**Note:** LDAP username is not your alias... it's the original username you were given.
**Note:** During sign_in we still test your password with a second bind, so you'll be able to test wrong password, etc in BID flows.

Edit ``client/js/provision.js`` and change the ``email.replace('dev.clortho.mozilla.org', 'mozilla.com');`` to match your local domain name.

See docs/DEV_NOTES.md and generate SSL certs under etc/

Use ``sudo clortho`` to run on port 443.

Running Clortho without a web server...

This service **must** run on port 443. This is baked into the BrowserID Primary Protocol.

    openssl genrsa -out privatekey.pem 1024 
    openssl req -new -key privatekey.pem -out certrequest.csr 
    openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem

