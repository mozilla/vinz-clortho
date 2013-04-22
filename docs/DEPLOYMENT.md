# DEPLOYMENT NOTES #

This application does it's own HTTP Basic Auth, so don't have Apache send basic auth headers.

## L10n
Server is prep'd for L10n, but there are no locale files. You can safely ignore the warning:

    Bad locale=[en_US] file(s) do not exist [/home/ozten/vinz-clortho/locale/en_US/LC_MESSAGES/messages.mo]. See locale/README

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
