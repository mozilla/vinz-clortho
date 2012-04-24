/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const conf = require("../etc/config"),
      crypto = require('./lib/crypto.js');
      jwk = require("jwcrypto/jwk"),
      jwcert = require("jwcrypto/jwcert"),
      util = require('util');

var auth = require('./lib/auth').auth(conf);

exports.routes = function () {
  var well_known_last_mod = new Date().getTime();
  return {
  public_key: null,
  private_key: null,
  ttl: null,
  well_known_browserid: function (req, resp) {
      // 6 hours in seconds
      var timeout = 120 ; //6 * 60 * 60; // in seconds
      console.log(req.headers);
      if (req.headers['if-modified-since'] !== undefined) {
        var since = new Date(req.headers['if-modified-since']);
        if (isNaN(since.getTime())) {
          console.error('======== Bad date in If-Modified-Since header');
        } else {
          util.puts(since);
          //TODO these are both true...
          console.log('========= since', '>', since, (well_known_last_mod < since), ' and < ', (since < well_known_last_mod));
          console.log('since==', since, 'well-known', new Date(well_known_last_mod));
          // Does the client already have the latest copy?
          if (since >= well_known_last_mod) {
            console.log('Use the Cache, luke');
            // TODO move above?
            resp.setHeader('Cache-Control', 'max-age=' + timeout);
            return resp.send(304);
          } else {
            console.log('=============== NO 304 FOR YOU =============');
          }
        }
      }
      // On startup, keys need to be pulled from memcache or some such
      var pk = JSON.stringify(crypto.pubKey);
      console.log('======= CACHE HEADERS ========');
      resp.setHeader('Content-Type', 'application/json');
      resp.setHeader('Cache-Control', 'max-age=' + timeout);
      resp.setHeader('Last-Modified', new Date(well_known_last_mod).toUTCString());
      resp.render('well_known_browserid', {
        public_key: pk,
        layout: false
      });
    },
    provision: function (req, resp) {
      console.log('provision called', req.session.email);
      resp.render('provision', {user: req.session.email,
                                browserid_server: conf.browserid_server,
                                layout: false});
    },
    provision_key: function (req, resp) {
      console.log('provisioning key', req.body.pubkey);
      if (!req.session || !req.session.email) {
        resp.writeHead(401);
        return resp.end();
      }
      if (!req.body.pubkey || !req.body.duration) {
        resp.writeHead(400);
        return resp.end();
      }

      crypto.cert_key(
        req.body.pubkey,
        req.session.email,
        req.body.duration,
        function(err, cert) {
          if (err) {
            resp.writeHead(500);
            resp.end();
          } else {
            resp.json({ cert: cert });
          }
        });
    },
    signin: function (req, resp) {
      resp.render('signin', {title: req.gettext("Sign In")});
    },
    check_signin: function (req, resp) {
      if (!req.body.user || !req.body.pass) {
        resp.writeHead(400);
        return resp.end();
      } else {
        auth.login(req.body.user.toLowerCase(), req.body.pass, function (err, passed) {
          if (err || ! passed) {
            resp.write('Email or Password incorrect');
            resp.writeHead(401);
          } else {
            var user = req.body.user.replace('@mozilla.com', '@' + conf.issuer);
            req.session.email = user;
            resp.writeHead(200);
          }
          resp.end();
        });
      }
    },
    signout: function (req, resp) { req.session.reset(); resp.send('bye!'); },
    handle404: function (req, resp) {
        resp.render('404.jade', {
                      title: req.gettext('yo'),
                      status: 404,

                      layout: null
                    });
    }
  };
};