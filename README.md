[![Build
Status](https://travis-ci.org/mozilla/vinz-clortho.png?branch=master)](https://travis-ci.org/mozilla/vinz-clortho)

# Mozilla IdP

``mozilla-idp`` is a server that implements support for Persona on the
mozilla.com domain.

When deployed, this will allow mozillans with `mozilla.com` or
`mozillafoundation.org` email addresses to authenticate with Persona enabled
websites using their Mozilla (LDAP) password.

## Getting Code to Production

This is the process for getting new code into Production

1. Do features and bug fixes in branches. Create a pull request to have new
   code merged into the `master` branch
1. Create a git tag of the master. This tag is used to generate the RPM
1. Create an RPM from the tag
1. Create a new staging server based on the new RPM
1. Have QA test to make sure everything is OK
1. *if* tests pass, create new production systems from same version. Otherwise
   go back to step 1. to fix issues.

## Why the RPM?

This is a quick introduction to how the Service Ops. team deploys Mozilla IdP.
For security and operational reasons we turn the application into an RPM and
deploy from our private RPM repository. 

This allows us to maintain a package that can be audited as well as very
specific versioning using RPMs. 

The scripts and processes for building the RPM exists in the
mozilla-services/svcops-oompaloompas repository.
