#!/usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* scripts/gen_keys.js creates public and private keys suitable for
   key signing Persona Primary IdP's.

   Usage:
   scripts/gen_keys.js

   Will create a new keypair at
       server/config/public-key.json
       server/config/private-key.json

   If these files already exist, this script will show an error message
   and exit. You must remove both keys if you want to generate a new
   keypair.
*/
const path = require('path');
// ./server is our current working directory
process.chdir(path.join(path.dirname(__dirname), 'server'));

const jwcrypto = require("jwcrypto")
      , util = require('util')
      , fs = require('fs')
      , assert = require("assert")
      , configDir = fs.realpathSync(__dirname + "/../server/config")
      , pubKeyFile = configDir + "/public-key.json"
      , secretKeyFile = configDir + "/secret-key.json"
      ;

require("jwcrypto/lib/algs/rs");

try {
  assert(fs.existsSync(configDir), "Config dir" + configDir + " not found");
  assert(! fs.existsSync(pubKeyFile), "public key file: ["+pubKeyFile+"] already exists");
  assert(! fs.existsSync(secretKeyFile), "public key file: ["+secretKeyFile+"] already exists");

} catch(e) {
  console.error("Error: " + e.message);
  process.exit(1);
}


console.log("Generating Public/Secret key files. This could take a few seconds...");
jwcrypto.generateKeypair(
  // keysize: 256 = 2048bit key
  // confusing? yes. ref: https://github.com/mozilla/jwcrypto/blob/master/lib/algs/ds.js#L37-L57
  {algorithm: 'RS', keysize: 256},
  function(err, keypair) {

    var pubKey = keypair.publicKey.serialize()
    var secretKey = keypair.secretKey.serialize()

    console.log("Public Key: ", pubKey);
    console.log("Secret Key: ", secretKey);

    fs.writeFileSync(pubKeyFile, pubKey);
    fs.writeFileSync(secretKeyFile, secretKey);
  }
);
