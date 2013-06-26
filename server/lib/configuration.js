/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const convict = require('convict'),
      fs = require('fs'),
      path = require('path');

var conf = module.exports = convict({
  browserid_server: { format: "url", default: "https://login.persona.org", },
  // configuration for "cef" logging, which is used to inject application level
  // security events into syslog
  security_logging: {
    vendor: { format: 'string',  default: "Mozilla" },
    product: { format: 'string',  default: "mozilla-idp" },
    version: { format: 'string', default: "0.0.0" },
    syslog_tag: { format: 'string',  default: "mozilla-idp" },
    syslog_host: {
      doc: 'Host where syslog service is listening',
      format: 'string',
      default: "127.0.0.1",
      env: 'CEF_SYSLOG_HOST'
    },
    syslog_port: {
      doc: 'Port on which syslog service will receive UDP messages',
      format: 'integer',
      default: 514,
      env: 'CEF_SYSLOG_PORT'
    }
  },
  certificate_validity_s: {
    doc: 'the amount of time certificates are valid',
    format: 'int',
    default: (5 * 60) // five minute default certification validity.
  },
  cookie: {
    secret: { format: 'string', default: "YOU MUST CHANGE ME" },
    duration_ms: { format: 'int', default: (24 * 60 * 60 * 1000) }
  },
  default_lang: { format: 'string', default: 'en-US' },
  debug_lang: { format: 'string', default: "it-CH" },
  domain_mapping: {
    doc: "Testing feature: Allows users to type in a testing domain to trigger the Mozilla IdP, but have their emails rewritten to mozilla domains",
    format: Object,
    default: {
      "mozilla.personatest.org": "mozilla.com"
    },
  },
  http_port: { format: 'int', env: "PORT", default: 3000 },
  http_address: { format: 'string', env: "ADDRESS", default: '127.0.0.1' },
  issuer: { format: 'string', default: "mozilla.personatest.org" },
  ldap_bind_dn: { format: 'string', default: "mail=USERNAME@mozilla.com,o=com,dc=mozilla" },
  ldap_bind_password: { format: 'string', default: "password" },
  ldap_server_url: {
    format: 'string',
    default: "ldaps://ldap.mozilla.org:636",
    env: 'LDAP_SERVER_URL'
  },
  ldap_search_bases: {
    doc: "The search bases for supported domains.  Both restricts the domains we support and provides configurable LDAP search base strings",
    format: Object,
    default: {
      "mozillafoundation.org": "o=org,dc=mozilla",
      "mozilla.com": "o=com,dc=mozilla"
    }
  },
  ldap_server_connect_timeout: { format: 'int', default: 10000 },
  locale_directory: { format: 'string', default: "locale" },
  statsd: {
    host: { format: "string", default: "127.0.0.1" },
    port: { format: "int", default: 8125 }
  },
  supported_languages: {
    doc: "List of languages this deployment should detect and display localized strings.",
    format: Array,
    default: [ "en-US" ],
    env: 'SUPPORTED_LANGUAGES'
  },
  config_path: {
    doc: "The path where deployment specific resources, such as keys, will be sought.",
    format: 'string',
    env: 'CONFIG_PATH',
    default: ""
  },
  auth_lockout_ms: {
    doc: "The amount of time to lockout a user upon successive fail auth attemtps",
    format: 'int',
    default: (5 * 60 * 1000)
  },
  auth_lockout_attempts: {
    doc: "The number of failed authentcation attempts before a user will be locked out",
    format: 'int',
    default: 5
  },
  local_development: {
    doc: "Run in local development mode, disables secure cookies",
    format: 'boolean',
    default: false,
    env: 'LOCAL_DEV'
  }
});

var dev_config_path = path.join(__dirname, '..', 'config', 'local.json');

if (! process.env.CONFIG_FILES &&
    fs.existsSync(dev_config_path)) {
  process.env.CONFIG_FILES = dev_config_path;
}

// handle configuration files.  you can specify a CSV list of configuration
// files to process, which will be overlayed in order, in the CONFIG_FILES
// environment variable
if (process.env.CONFIG_FILES) {
  var files = process.env.CONFIG_FILES.split(',');
  files.forEach(function(file) {
    var c = JSON.parse(fs.readFileSync(file, 'utf8'));
    conf.load(c);
  });
}

// if var path has not been set, let's default to var/
// XXX: due to a bug in convict, .has() seems to not be working properly,
// thus we must explicitly check for the empty string
if (conf.get('config_path') === "") {
  conf.set('config_path', path.join(__dirname, "..", "config"));
}

// massage bind address to something node will understand
if ([ '0.0.0.0', '*' ].indexOf(conf.get('http_address')) !== -1) {
  conf.set('http_address', null);
}

