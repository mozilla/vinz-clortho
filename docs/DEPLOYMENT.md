# DEPLOYMENT NOTES #

This application does it's own HTTP Basic Auth, so don't have Apache send basic auth headers.

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