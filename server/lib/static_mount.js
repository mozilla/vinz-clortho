/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const config = require('./configuration');

/**
 * static_mount_path support
 * Allows for mounting this application under a root path.
 * Example: https://intranet.mozilla.org/persona/
 *
 * The /.well-known/browserid path must be top level, but other
 * static and dynamic resources can be put under a rooot.
 *
 * This middleware provides this path to views and strips it
 * from requests.
*/
exports.mount = function(req, res, next) {
  var static_mount_path = config.get('static_mount_path') || '';
  res.local('static_mount_path', static_mount_path);
  if (req.url.indexOf(static_mount_path) === 0) {
    req.url = req.url.replace(static_mount_path, '');
  }
  if (req.url[0] !== '/') {
    req.url = '/' + req.url;
  }
  next();
};