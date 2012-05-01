# Testing Notes

Vinz Clortho is an IdP hosted under https://intranet.mozilla.org for email addresses such as mozilla.com. This leads to a slightly complicated structure in production and a very complicated strucutre in stage.

![Delegation and Testing diagram](../../../raw/master/docs/delegation_and_testing.jpg)

If you want to test in "development" you'll go to [dev.myfavoritebeer.org](https://dev.myfavoritebeer.org) and enter ``<LDAP USERNAME>@dev-id.allizom.org``. When prompted by HTTP Basic Auth, use your real LDAP password. The system will fixup your email address to be ``<LDAP USERNAME>@mozilla.com`` during LDAP authentication.

**Note:** Vinz Clortho is not hosted at dev-id.allizom.org. It is hosted at intranet-dev.allizom.org. dev-id.allizom.org existing to test the delegation part that mozilla.com will also do in production.

To test in stage, use ``<LDAP USERNAME>@stage-id.allizom.org``...