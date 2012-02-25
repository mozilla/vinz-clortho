const conf = require("../etc/config"),
      crypto = require('./lib/crypto.js');
      jwk = require("jwcrypto/jwk"),
      jwcert = require("jwcrypto/jwcert");

console.log(conf);
var auth = require('./lib/auth').auth(conf);

exports.routes = function () {
  return {
  public_key: null,
  private_key: null,
  ttl: null,
  well_known_browserid: function (req, resp) {
      var timeout = 6 * 60 * 60;
      // On startup, keys need to be pulled from memcache or some such
      var pk = JSON.stringify(crypto.pubKey);
      resp.setHeader('Content-Type', 'application/json');
      resp.setHeader('Cache-Control', 'max-age=' + timeout);
      resp.render('well_known_browserid', {
        public_key: pk,
        layout: false
      });
    },
    provision: function (req, resp) {
      console.log(req.session);
      resp.render('provision', {user: 
                                req.session.email, 
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
      resp.render('signin', {title: "Sign in to Mozilla LDAP"});
    },
    check_signin: function (req, resp) {       
      if (!req.body.user || !req.body.pass) {
        resp.writeHead(400);
        return resp.end();
      } else {
        // LDAP is case-insensitive...
        console.log('authing', req.body.user, req.body.pass);

        auth.login(req.body.user, req.body.pass, function (err, passed) {
          if (err || ! passed) {
            resp.write('Email or Password incorrect');
            resp.writeHead(401);
          } else {
            req.session.email = req.body.user;
            resp.writeHead(200);
          }
          resp.end();
        });
      }
    }
  };
};