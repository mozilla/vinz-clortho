# Mozilla IdP

``mozilla-idp`` is a server that implements support for Persona on the mozilla.com domain.

When deployed, this will allow mozillans with `mozilla.com` or `mozilla.org` email addresses
to authenticate with Persona enabled websites using their Mozilla (LDAP) password.

It is a HTTP node.js server which exposes 3 URLs.

* /.well-known/browserid
* /browserid/sign_in
* /browserid/provision

## Usage

By routing HTTPS traffic to your domain (same one as email domain) for these three new urls,
users can use their LDAP email address and email aliases across the web.

Users will be prompted to sign in. Their LDAP credentials will be used to bind to your existing backend.
A session will be created and they will be on their merry way.

## Installation

Install [Node.js](http://nodejs.org) version 0.8 or newer.

    npm install

Look for errors. You will need several C and C++ header files on your system, such as:

* libgmp3-dev

### Configuration

    cp etc/config.js-dist etc/config.js

Edit following settings:

* exports.session_sekrit = 'Some random string';
* exports.ldap_server_url = 'ldaps://addressbook.mozilla.com:636';
* exports.ldap_bind_dn = 'mail=USERNAME@mozilla.com,o=com,dc=mozilla';
* exports.ldap_bind_password = 'sekrit password';
* exports.issuer = 'mozilla.com';

## HTTP vs HTTPS

This app runs under http.  If you want to run it as HTTPs you can change the code, or use a proxy

## Start up

    clortho

This will start the server listening on port 3000. You can control port and protocol via ``etc/config.js``. Or the `PORT` environment variable. See docs/DEPLOYMENT.md.

## Shutdown

Kill the foreground process with ``Cntl-C``.

## Testing

Go to a BrowserID enabled website, such as [123done](http://123done.org/) and enter ``MyUsername``@``Issuer.tld``into the email address area.

Example:

For a system which has

    exports.issuer = 'example.com';

Alice would enter ``alice@example.com``.

Persona will discover that your organization is a primary
identity provider for example.com and trust your LDAP system to authenticate
Alice properly. You'll see GET and POST requests on the 3 urls listed above.

## Maintenance

Sessions are stored in encrypted cookies on the user's browser. There
are no backend databases.

Making sure the clortho daemon is up and running is the only maintenance task.
