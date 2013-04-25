/*
 * Mock LDAP server, useful for testing and development
 *
 */

const ldap = require("ldapjs");

// mmmmm... all passwords are "test"
var directory = [
    // the vinz clortho binds as this user
    {dn: "cn=vinz, o=com, dc=mozilla", attributes: { cn: "vinz" }}, 

    {dn: "mail=user@mozilla.com, o=com, dc=mozilla", 
        attributes: { mail: "user@mozilla.com" }}, 

    {dn: "mail=user@mozilla.org, o=org, dc=mozilla", 
        attributes: { mail: "user@mozilla.org" }},

    {dn: "mail=user@mozilla.com.localdomain, o=com, dc=mozilla.localdomain", 
        attributes: { mail: "user@mozilla.com.localdomain" }},

    {dn: "mail=user@mozilla.org.localdomain, o=org, dc=mozilla.localdomain", 
        attributes: { mail: "user@mozilla.org.localdomain" }},
];

ldapServer = ldap.createServer()

// make sure binds are correct
ldapServer.bind('dc=mozilla', function(req, res, next) {
    var bindDN = req.dn.toString();
    var credentials = req.credentials;
    for(var i=0; i < directory.length; i++) {
        if(directory[i].dn === bindDN && credentials == "test") {

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
});

// some middleware to make sure the user has a successfully bind 
function authorize(req, res, next) {
    for(var i=0; i < directory.length; i++) {
        if (req.connection.ldap.bindDN.equals(directory[i].dn)) {
            this.emit('authorize', {
                success: true,
                dn: req.connection.ldap.bindDN,
            });
            return next();
        }
    }

    this.emit('authorize', {
        success: false,
        dn: req.connection.ldap.bindDN,
    });

    return next(new ldap.InsufficientAccessRightsError());
}

ldapServer.search('dc=mozilla', [authorize], function(req, res, next) {
    directory.forEach(function(user) {
        if (req.filter.matches(user.attributes)) {
            res.send(user);
        }
    });

    res.end();
    return next();
});

module.exports = exports = {
    directory: directory,
    server: ldapServer
};
