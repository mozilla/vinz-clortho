/* A LDAP server for testing */

var ldap = require('ldapjs');

exports.create = function(cb) {
  var server = ldap.createServer();

  server.bind('o=example', function(req, res, next) {
    if (req.dn.toString() !== 'o=example' || req.credentials !== 'secret')
      return next(new ldap.InvalidCredentialsError());
    res.end();
    return next();
  });

  server.search('o=example', function(req, res, next) {
    var obj = {
      dn: req.dn.toString(),
      attributes: {
        objectclass: ['organization', 'top'],
        o: 'example'
      }
    };

    if (req.filter.matches(obj.attributes))
      res.send(obj);

    res.end();
  });

  server.listen(65077, '127.0.0.1', function(err) {
    cb(err, server);
  });
};
