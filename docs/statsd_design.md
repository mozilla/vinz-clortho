This project uses statsd to report application level metrics.

The goal of statsd is to help you verify the application is
running correctly, and to facilitate problem isolation when
it's not.

Here is the statsd hierarchy:

  * `mozillaidp` - top level bucket for all stats
    * `ldap` - stats related to communication with LDAP
      * `error` - counter of specific types of LDAP errors
      * `auth` - counter of authentication attempts (success & failure)
      * `timing` - granular timing for interactions with LDAP
    * `server` - high level application events
      * `uncaught_exception` - a js exception was thrown that wasn't caught
      * `started` - the server started up
    * `healthcheck` - status of health check when requested by load balancers
      * `ok`
      * `error`

The ultimate source of truth is always the code, but an effort
should be made to keep this document up to date to describe the general
hierarchy so that statsd data is discoverable and easy to use as a
problem isolation tool.
