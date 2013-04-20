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

// ENV Variables
try {
  exports.pubKey = JSON.parse(process.env['PUBLIC_KEY']);
  _privKey = JSON.parse(process.env['PRIVATE_KEY']);
} catch(e) { }
// or var file system cache
if (!exports.pubKey) {
  try {
    store.read_files_sync(function (err, publicKey, secretKey) {
      if (! err) {
        exports.pubKey = publicKey;
        _privKey = secretKey;
      }
    });
  } catch (e) { }
}

var _privKey = null;

// or ephemeral
if (!exports.pubKey) {
  if (exports.pubKey != exports.privKey) {
    throw "inconsistent configuration!  if privKey is defined, so must be pubKey";
  }
  // if no keys are provided emit a nasty message and generate some
  console.warn("WARNING: you're using ephemeral keys.  They will be purged at restart.");

  jwcrypto.generateKeypair({algorithm: 'RS', keysize: 256}, function(err, keypair) {
    exports.pubKey = JSON.parse(keypair.publicKey.serialize());
    _privKey = JSON.parse(keypair.secretKey.serialize());
  });
} else {
  // turn _privKey into an instance
  _privKey = JSON.parse(_privKey);
}

exports.cert_key = function(pubkey, email, duration_s, cb) {
  var expiration = new Date();
  var pubkey = jwk.PublicKey.fromSimpleObject(pubkey);
  expiration.setTime(new Date().valueOf() + duration_s * 1000);
  process.nextTick(function() {
    cb(null, (new jwcert.JWCert(config.get('issuer'), expiration, new Date(),
                                pubkey, {email: email})).sign(_privKey));
  });
};
