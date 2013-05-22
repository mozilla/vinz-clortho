/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const convict = require('convict'),
      fs = require('fs'),
      path = require('path');

var conf = module.exports = convict({
  browserid_server: { format: "url", default: "https://login.persona.org", },
  client_sessions: {
    cookie_name: { format: 'string', default: "session_state" },
    secret: { format: 'string', default: "YOU MUST CHANGE ME" },
    duration: { format: 'int', default: (24 * 60 * 60 * 1000) }
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
  ldap_server_url: { format: 'string', default: "ldaps://ldap.mozilla.org:636" },
  ldap_server_connect_timeout: { format: 'int', default: 10000 },
  locale_directory: { format: 'string', default: "locale" },
  statsd: {
    enabled: {
      doc: "enable UDP based statsd reporting",
      format: Boolean,
      default: true,
      env: 'ENABLE_STATSD'
    },
    host: { format: "string", default: "" },
    port: { format: "int", default: 6000 }
  },
  static_mount_path: {
    doc: "Base path where static files will be served from. Reduces URL conflicts. Examples: '/', '/browserid' ",
    format: 'string',
    default: "/browserid"
  },
  supported_languages: {
    doc: "List of languages this deployment should detect and display localized strings.",
    format: Array,
    default: [ "en-US" ],
    env: 'SUPPORTED_LANGUAGES'
  },
  var_path: {
    doc: "The path where deployment specific resources will be sought (keys, etc), and logs will be kept.",
    format: 'string',
    default: "",
    env: 'VAR_PATH'
  },
});

var dev_config_path = path.join(__dirname, '..', 'config', 'local.json');

if (! process.env['CONFIG_FILES'] &&
    fs.existsSync(dev_config_path)) {
  process.env['CONFIG_FILES'] = dev_config_path;
}

// handle configuration files.  you can specify a CSV list of configuration
// files to process, which will be overlayed in order, in the CONFIG_FILES
// environment variable
if (process.env['CONFIG_FILES']) {
  var files = process.env['CONFIG_FILES'].split(',');
  files.forEach(function(file) {
    var c = JSON.parse(fs.readFileSync(file, 'utf8'));
    conf.load(c);
  });
}

// if var path has not been set, let's default to var/
if (!conf.has('var_path')) {
  conf.set('var_path', path.join(__dirname, "..", "var"));
}

// massage bind address to something node will understand
if ([ '0.0.0.0', '*' ].indexOf(conf.get('http_address')) != -1) {
    conf.set('http_address', null);
}
