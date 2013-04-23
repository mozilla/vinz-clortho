# Mozilla IdP

``mozilla-idp`` is a server that implements support for Persona on the mozilla.com domain.

When deployed, this will allow mozillans with `mozilla.com` or `mozilla.org` email addresses
to authenticate with Persona enabled websites using their Mozilla (LDAP) password.


## Deployment 

![Deployment Diagram](./docs/aws-infrastructure.png)

* Multi-Region, Multi availability zone deployment
* Use Route53 to DNS load balance across regions and manage region availability
* Use ELB to 
    * terminate SSL 
    * direct traffic to available hosts


