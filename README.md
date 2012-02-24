# Vinz Clortho

**Status:** This service is under active development and **not ready for production systems**.

``vinz-clortho`` is a BrowserID primary for organizations that use LDAP as their authentication.

It is a HTTPS Node.js server which exposes 3 URLs.

* /.well-known/browserid
* /browserid/sign_in
* /browserid/provision

## Usage

By routing HTTPS traffic to your domain (same one as email domain) for these three new urls, 
users can use their LDAP email address and email aliases across the web. 

Users will be prompted to sign in. Their LDAP credentials will be used to bind to your existing backend. 
A session will be created and they will be on their merry way.

## Installation

Install [Node.js](http://nodejs.org).

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

This application uses a simple bind in LDAP to search for the user's DN, 
before trying to bind as the user. ``ldap_bind_dn`` and ``ldap_bind_password`` will be set to ``''`` for many systems, that have configured an anonymous
binding. Alternatively, you may have secured your system with a shared 
bind dn and password, you'd enter those here.

## Start up

    sudo clortho

This will start the server listening on port 443.

## Shutdown

Kill the foreground process with ``Cntl-C``.

## Testing

Go to a BrowserID enabled website, such as [My Favorite Beer](http://myfavoritebeer.org/) and enter <My Username>@<Issuer> into the email address area.

Example:
For a system which has

    exports.issuer = 'example.com';

Alice would enter ``alice@example.com``.

The BrowserID protocol will discover that your organization is a primary 
identity provider for example.com and trust your LDAP system to authenticate
Alice properly. You'll see GET and POST requests on the 3 urls listed above.

## Maintenance

Sessions are stored in encrypted cookies on the user's browser. There 
are no backend databases.

Making sure the clortho daemon is up and running is the only maintenance task.