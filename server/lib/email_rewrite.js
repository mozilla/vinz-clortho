/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('./configuration.js');

module.exports = function(email) {
  var domainMapping = config.get('domain_mapping');
  var parts = email.split('@');
  if (parts.length === 2 && domainMapping[parts[1]]) {
    email = parts[0] + '@' + domainMapping[parts[1]];
  }
  return email;
};
