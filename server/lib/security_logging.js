/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Security logging via 'CEF' is intended to report security events
 * that could not be caused by non-malicious usage of the system.
 *
 * Some basic guidance with respect to "what to log" are here:
 *  - https://wiki.mozilla.org/Security/Users_and_Logs#What_to_Log
 *
 * With respect to the Mozilla IdP, event to log will be of the
 * nature - 5 password failures in a row.
 */

var cef = require('cef'),
   conf = require('./configuration.js');

module.exports = new cef.Logger(conf.get('security_logging'));



