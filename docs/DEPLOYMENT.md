# DEPLOYMENT NOTES #

This application does it's own HTTP Basic Auth, so don't have Apache send basic auth headers.

## Public and Secret Keypair
This server does cryptographic operations as part of the Persona Primary protocol.

You must have public/secret keys. There are several ways to achieve this:
* Using the following environment variables: ``PUBLIC_KEY`` ``PRIVATE_KEY``
* Using scripts/gen_keys.js to create ``server/var/server_secret_key.json``  ``server/var/server_public_key.json``
* Letting the server automatically create ``ephemeral`` keys, which change on restart

Ephemeral is only appropriate in development environments. If deploying Vinz Clortho in a clustered environment, all
servers must have the same keypair.

### Protect the keys
The server_secret_key.json key is extremely sensative, protect it!

Only the public key can be shared via HTTP.

## Configuration

Be sure to read server/lib/configuration.js which has all the possible configuration flags, their possible values, as well as documentation.

## Delegated IdP Test Mode
When deployed to dev or stage, the config value ``test_delegate_domain_override`` must be set.

Example:

On the server ``intranet-dev.mozilla.org`` which is delegated to by ``dev-id.allizom.org``, we'd use the following value:

    "test_delegate_domain_override": "dev-id.allizom.org"

This causes JavaScript code to run which re-writes the user's email address from

    <LDAP USERNAME>@<DELEGAGTED DOMAIN.TLD>

to

    <LDAP USERNAME>@mozilla.com

The config field ``test_delegate_domain_override`` **should never** be set in production. As a reminder the server will warn on startup.