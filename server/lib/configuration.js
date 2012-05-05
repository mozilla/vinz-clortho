/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const convict = require('convict'),
      fs = require('fs'),
      path = require('path');

var conf = module.exports = convict({
  basic_auth_realm: {
    doc: "Used when signin_method is basicauth",
    format: 'string = "Basic realm=\\"Mozilla Corporation - LDAP Login\\""'
  },

  browserid_server: 'string = "https://browserid.org"',
  client_sessions: {
    cookie_name: 'string = "session_state"',
    secret: 'string = "YOU MUST CHANGE ME"',
    duration: 'integer = '  + (24 * 60 * 60 * 1000) // 1 day
  },
  default_lang: 'string = "en-US"',
  debug_lang: 'string = "it-CH"',
  http_port: 'integer = 3000',
  issuer: 'string = "dev.clortho.org"',
  ldap_bind_dn: 'string = "mail=USERNAME@mozilla.com,o=com,dc=mozilla"',
  ldap_bind_password: 'string = "password"',
  ldap_server_url: 'string = "ldaps://addressbook.mozilla.com:636"',
  locale_directory: 'string = "locale"',
  signin_method: {
    doc: "How should this app collect authentication credentials? With an HTML form or Basic Auth",
    format: 'string ["form", "basicauth"] = "basicauth"'
  },
  statsd: {
    enabled: {
      doc: "enable UDP based statsd reporting",
      format: 'boolean = true',
      env: 'ENABLE_STATSD'
    },
    host: "string?",
    port: "integer{1,65535}?"
  },
  static_mount_path: {
    doc: "Base path where static files will be served from. Reduces URL conflicts. Examples: '/', '/browserid' ",
    format: 'string = "/browserid"'
  },
  supported_languages: {
    doc: "List of languages this deployment should detect and display localized strings.",
    format: 'array { string }* = [ "en-US" ]',
    env: 'SUPPORTED_LANGUAGES'
  },
  test_delegate_domain_override: {
    doc: "Dev or Test environments will have a fake domain to delegate to us. See DEPLOYMENT.md",
    format: 'string = ""'
  },
  use_https: 'boolean = false',
  var_path: {
    doc: "The path where deployment specific resources will be sought (keys, etc), and logs will be kept.",
    format: 'string?',
    env: 'VAR_PATH'
  },
});

// At the time this file is required, we'll determine the "process name" for this proc
// if we can determine what type of process it is (browserid or verifier) based
// on the path, we'll use that, otherwise we'll name it 'ephemeral'.
conf.set('process_type', path.basename(process.argv[1], ".js"));

var dev_config_path = path.join(process.cwd(), 'config', 'local.json');

if (! process.env['CONFIG_FILES'] &&
    path.existsSync(dev_config_path)) {
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