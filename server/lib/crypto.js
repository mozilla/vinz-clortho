/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const jwcrypto = require("jwcrypto"),
      cert = jwcrypto.cert,
      config = require('./configuration'),
      store = require('./keypair_store');

// load desired algorithms
require("jwcrypto/lib/algs/rs");
require("jwcrypto/lib/algs/ds");

var _privKey = null;

// Load Pub/Private keys from the filesystem
try {
  store.read_files_sync(function (err, publicKey, secretKey) {
    if (! err) {
      exports.pubKey = publicKey;
      _privKey = jwcrypto.loadSecretKey(JSON.stringify(secretKey));
    }
  });
} catch (e) { }

exports.cert_key = function(pubkey, email, duration_s, cb) {
  var pubKey = jwcrypto.loadPublicKey(pubkey);

  var expiration = new Date();
  var iat = new Date();

  expiration.setTime(new Date().valueOf() + (duration_s * 1000));

  // Set issuedAt to 10 seconds ago. Pads for verifier clock skew
  iat.setTime(iat.valueOf() - (10 * 1000));

  cert.sign(
    {publicKey: pubKey, principal: {email: email}},
    {issuer: config.get('issuer'), issuedAt: iat, expiresAt: expiration},
    null,
    _privKey,
    cb);
};
