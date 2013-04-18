/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 const config = require('./lib/configuration'),
       crypto = require('./lib/crypto.js');
       jwk = require("jwcrypto/jwk"),
       jwcert = require("jwcrypto/jwcert"),
       util = require('util');

var auth = require('./lib/auth').auth(config);

exports.routes = function () {
  var well_known_last_mod = new Date().getTime();
  return {
  public_key: null,
  private_key: null,
  ttl: null,
  well_known_browserid: function (req, resp) {
      // 2 minutes in seconds
      var timeout = 120 ; //2 * 60; // in seconds
      if (req.headers['if-modified-since'] !== undefined) {
        var since = new Date(req.headers['if-modified-since']);
        if (isNaN(since.getTime())) {
          console.error('Bad date in If-Modified-Since header [' +
            req.headers['if-modified-since'] + ']');
        } else {
          // Does the client already have the latest copy?
          if (since >= well_known_last_mod) {
            resp.setHeader('Cache-Control', 'max-age=' + timeout);
            return resp.send(304);
          }
        }
      }
      // On startup, keys need to be pulled from memcache or some such
      var pk = JSON.stringify(crypto.pubKey);
      resp.setHeader('Content-Type', 'application/json');
      resp.setHeader('Cache-Control', 'max-age=' + timeout);
      resp.setHeader('Last-Modified', new Date(well_known_last_mod).toUTCString());
      resp.render('well_known_browserid', {
        public_key: pk,
        layout: false
      });
    },
    provision: function (req, resp) {
      resp.render('provision', {user: req.session.email,
                                browserid_server: config.get('browserid_server'),
                                layout: false});
    },
    provision_key: function (req, resp) {
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

    /* signin_from_form and check_signin_from_form are used for
       processing form based authentication, used when
       signin_method is 'form' */
    signin_from_form: function (req, resp) {
      var test_delegate = config.get('test_delegate_domain_override');
      resp.render('signin', {
        title: req.gettext("Sign In"),
        delegate_domain_override: (!!test_delegate)
      });
    },
    check_signin_from_form: function (req, resp) {
      if (!req.body.user || !req.body.pass) {
        resp.writeHead(400);
        return resp.end();
      } else {
        auth.login(req.body.user.toLowerCase(), req.body.pass, function (err, passed) {
          if (err || ! passed) {
            resp.write('Email or Password incorrect');
            resp.writeHead(401);
          } else {
            var test_delegate = config.get('test_delegate_domain_override'),
                user = req.body.user;
            if (!! test_delegate) {
              user = req.body.user.replace('@mozilla.com', '@' + test_delegate);
            }
            req.session.email = user;
            resp.writeHead(200);
          }
          resp.end();
        });
      }
    },
    /* signin_from_basicauth is used for processing Basic Auth HTTP headers
       used when signin_method is 'basicauth' */
    signin_from_basicauth: function (req, resp) {
      var challange = function () {
        resp.statusCode = 401;
        resp.setHeader('WWW-Authenticate', config.get('basic_auth_realm'));
        resp.render('basicauth_cancel', {layout: false});
      };
      if (req.headers['authorization']) {
        auth.basic_auth_decode(req.headers['authorization'], function (err, email, password) {
          if (err) {
            console.warn(err);
            challange();
          } else {
            // This is needed for test environments... but is ugly
            // tst_delegate will always be empty in production
            var orig_email = email;
            var test_delegate = config.get('test_delegate_domain_override');

            if (!! test_delegate) {
              email = email.replace(test_delegate, 'mozilla.com');
            }

            auth.login(email.toLowerCase(), password, function (err, passed) {
              if (err || ! passed) {
                console.warn('Email or Password incorrect');
                challange();
              } else {
                req.session.email = orig_email;
                resp.render('basicauth_success', {
                  layout: false,
                  current_user: orig_email
                });
                resp.end();
              }
            });
          }
        });
      } else {
        challange();
      }
    },

    // QA Only URLs
    signout: function (req, resp) { req.session.reset(); resp.redirect(config.get('static_mount_path')); },
    delegate_domain_override: function (req, resp) {
      var test_delegate = config.get('test_delegate_domain_override');
      resp.header('Content-Type', 'application/javascript');
      if (test_delegate) {
        resp.write(
          util.format(
            "function fixup_delegate_domain (email) { return email.replace('%s', 'mozilla.com'); }",
            test_delegate));
      }
      resp.end();
    },

    handle404: function (req, resp) {
        resp.render('404', {
                      title: '',
                      status: 404,

                      layout: null
                    });
    }
  };
};
