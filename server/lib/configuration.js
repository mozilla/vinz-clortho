/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const convict = require('convict'),
      fs = require('fs'),
      path = require('path');

var conf = module.exports = convict({
  basic_auth_realm: {
    doc: "Used when signin_method is basicauth",
    format: 'string',
    default: 'Basic realm="Mozilla Corporation - LDAP Login"'
  },
  browserid_server: { format: "url", default: "https://login.persona.org", },
  client_sessions: {
    cookie_name: { format: 'string', default: "session_state" },
    secret: { format: 'string', default: "YOU MUST CHANGE ME" },
    duration: { format: 'int', default: (24 * 60 * 60 * 1000) }
  },
  default_lang: { format: 'string', default: 'en-US' },
  debug_lang: { format: 'string', default: "it-CH" },
  http_port: { format: 'int', env: "PORT", default: 3000 },
  issuer: { format: 'string', default: "mozilla.personatest.org" },
  ldap_bind_dn: { format: 'string', default: "mail=USERNAME@mozilla.com,o=com,dc=mozilla" },
  ldap_bind_password: { format: 'string', default: "password" },
  ldap_server_url: { format: 'string', default: "ldaps://ldap.mozilla.org:636" },
  locale_directory: { format: 'string', default: "locale" },
  signin_method: {
    doc: "How should this app collect authentication credentials? With an HTML form or Basic Auth",
    format: ["form", "basicauth"],
    default: 'form'
  },
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
  test_delegate_domain_override: {
    doc: "Dev or Test environments will have a fake domain to delegate to us. See DEPLOYMENT.md",
    format: 'string',
    default: ""
  },
  var_path: {
    doc: "The path where deployment specific resources will be sought (keys, etc), and logs will be kept.",
    format: 'string',
    default: "",
    env: 'VAR_PATH'
  },
});

// At the time this file is required, we'll determine the "process name" for this proc
// if we can determine what type of process it is (browserid or verifier) based
// on the path, we'll use that, otherwise we'll name it 'ephemeral'.
conf.set('process_type', path.basename(process.argv[1], ".js"));

var dev_config_path = path.join(process.cwd(), 'config', 'local.json');

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
