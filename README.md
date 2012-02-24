## Setup ##

Add a local domain name to your /etc/hosts file or deploy to a server. Localhost won't work with jschannel stuff.

Copy etc/config.js-dist to etc/config.js and add your LDAP username and LDAP password, so the server can bind as you. In production, this will be replaced with a "bind user", but you can serve that role in development.

**Note:** LDAP username is not your alias... it's the original username you were given.
**Note:** During sign_in we still test your password with a second bind, so you'll be able to test wrong password, etc in BID flows.

Edit ``client/js/provision.js`` and change the ``email.replace('dev.clortho.mozilla.org', 'mozilla.com');`` to match your local domain name.

See docs/DEV_NOTES.md and generate SSL certs under etc/

Use ``sudo clortho`` to run on port 443.

You can ignore notes below here...

## Bugs ##
* BID doesn't recognized self-signed certs
** BAD https://browserid.org/wsapi/address_info?email=ozten%40vinz.clortho.org
** BAD https://diresworb.org/wsapi/address_info?email=ozten%40vinz.clortho.org
** GOOD https://dev.diresworb.org/wsapi/address_info?email=ozten%40vinz.clortho.org
** https://diresworb.org/wsapi/address_info?email=ozten%40browserid-i5y.herokuapp.com

## Painpoints ##
* Can't test system unless it's on the public internet
** /.well-known/browserid must be fetchable by browserid.org
* BID lint - Check DNS, well-known file, etc
* Network issues, our squid reverse proxy caching
* Lack of js_channel debugging in Fx and Chrome
** Bad JS in a script file, no errors but entire js file stops being loaded
** provisioning_api MUST be from the same domain as your testing (I had local and browserid.org...)
* /.well-known/browserid requires 'Content-Type', 'application/json' but some web servers will serve application/octet-stream
* BrowserID server caches things like "this is not a primary", so you can fix your mistake w/o restarting the server.

## Pro Tips ##
https://browserid.org/wsapi/address_info?email=ozten%40browserid-i5y.herokuapp.com
https://browserid.org/wsapi/address_info?email=ozten%40browserid-i5y.herokuapp.com
https://browserid.org/wsapi/address_info?email=ozten%40browserid-i5y.herokuapp.com

## Questions ##

* How long does the public-key at /.well-known/browserid live for?
** When you change it... what happens to other requests mid-flight?
* well known gives us provisioning and authentication, but why no logout