/*
 * Mock LDAP server, useful for testing and development
 *
 */

const ldap = require("ldapjs");

module.exports = function() {

  var i = 0;

  // mmmmm... all passwords are "testtest"
  var directory = [
    // the vinz clortho binds as this user
    {dn: "cn=vinz, o=com, dc=mozilla", attributes: { cn: "vinz", password: "testtest" }},

    // for testing of actual live hosts
    {dn: "mail=user@clortho.personatest.org, o=com, dc=mozilla",
     attributes: { mail: "user@clortho.personatest.org" }}
  ];

  // Create some Testing users
  for(i=1; i <= 6; i++) {
    directory.push({
      dn: "mail=user"+i+"@mozilla.com, o=com, dc=mozilla",
      attributes: {
        // note only use lowercase attribute names, seems to be an ldapjs 
        // implementationd detail
        mail: "user"+i+"@mozilla.com",
        zimbraalias: 'alias'+i+"@mozilla.com",
        password:"testtest"
      }
    });
  }

  for(i=1; i <= 6; i++) {
    directory.push({
      dn: "mail=user"+i+"@mozilla.org, o=org, dc=mozilla",
      attributes: {
        mail: "user"+i+"@mozilla.org",
        zimbraalias: 'alias'+i+"@mozilla.org",
        password: "testtest"
      }
    });
  }

  function bindHandler(req, res, next) {
    var bindDN = req.dn.toString();
    var credentials = req.credentials;
    for(var i=0; i < directory.length; i++) {
      if(directory[i].dn === bindDN && credentials === directory[i].attributes.password) {

        this.emit('bind', {
          success: true,
          dn: bindDN,
          credentials: credentials
        });

        res.end();
        return next();
      }
    }

    this.emit('bind', {
      success: false,
      dn: bindDN,
      credentials: credentials
    });

    return next(new ldap.InvalidCredentialsError());
  }

  function searchHandler(req, res, next) {
    directory.forEach(function(user) {
      if (req.filter.matches(user.attributes)) {
        res.send(user);
      }
    });

    res.end();
    return next();
  }

  // some middleware to make sure the user has a successfully bind
  function authorize(req, res, next) {
    for(var i=0; i < directory.length; i++) {
      if (req.connection.ldap.bindDN.equals(directory[i].dn)) {
        this.emit('authorize', {
          success: true,
          dn: req.connection.ldap.bindDN
        });
        return next();
      }
    }

    this.emit('authorize', {
      success: false,
      dn: req.connection.ldap.bindDN
    });

    return next(new ldap.InsufficientAccessRightsError());
  }

  var ldapServer = ldap.createServer();
  ldapServer.bind('dc=mozilla', bindHandler);
  ldapServer.search('dc=mozilla', [authorize], searchHandler);

  return {
    directory: directory,
    server: ldapServer,
    bindHandler: bindHandler,
    searchHandler: searchHandler
  };
};
