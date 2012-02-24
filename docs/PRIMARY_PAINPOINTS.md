# Primary Painpoints
Wherein we document gotchas and things that caught me while writing this Primary.

## Bugs

* BID doesn't recognized self-signed certs
** BAD [Production](https://browserid.org/wsapi/address_info?email=ozten%40vinz.clortho.org)
** BAD [Stage](https://diresworb.org/wsapi/address_info?email=ozten%40vinz.clortho.org)
** GOOD [Dev](https://dev.diresworb.org/wsapi/address_info?email=ozten%40vinz.clortho.org)

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
  ** Caches non-200 responses also
* Debugging certificate problems (document format, better tooling)

## Pro Tips ##

* curl https://browserid.org/wsapi/address_info?email=ozten%40browserid-i5y.herokuapp.com
* or https://browserid.org/wsapi/address_info?email=<USERNAME>%40<ISSUER DOMAIN>
* Certificates a ``.`` seperated Base64 URL encoded messages. You can use [utils.js](https://github.com/mozilla/jwcrypto) to decode via nod.e

## Questions ##
Notes for questions to answer...

* How long does the public-key at /.well-known/browserid live for?
** When you change it... what happens to other requests mid-flight?
* well known gives us provisioning and authentication, but why no logout