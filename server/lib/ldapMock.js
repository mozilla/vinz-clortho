/*
 * Mock LDAP server, useful for testing and development
 *
 */

const ldap = require("ldapjs");

// mmmmm... all passwords are "test"
var directory = [
    // the vinz clortho binds as this user
    {dn: "cn=vinz, dc=mozilla, o=com", attributes: { cn: "vinz" }}, 

    {dn: "mail=user@mozilla.com, dc=mozilla, o=com", 
        attributes: { mail: "user@mozilla.com" }}, 

    {dn: "mail=user@mozilla.org, dc=mozilla, o=com", 
        attributes: { mail: "user@mozilla.org" }},

    {dn: "mail=user@mozilla.org.localdomain, dc=mozilla, o=com", 
        attributes: { mail: "user@mozilla.org.localdomain" }},

    {dn: "mail=user@mozilla.org.localdomain, dc=mozilla, o=com", 
        attributes: { mail: "user@mozilla.org.localdomain" }},
];

ldapServer = ldap.createServer()


ldapServer.bind('dc=mozilla, o=com', function(req, res, next) {
    var bindDN = req.dn.toString();
    var credentials = req.credentials;
    for(var i=0; i < directory.length; i++) {
        if(directory[i].dn === bindDN && credentials == "test") {
            res.end();
            return next();
        }
    }

    return next(new ldap.InvalidCredentialsError());
});

// some middleware to make sure the user has successful bound
function authorize(req, res, next) {
    for(var i=0; i < directory.length; i++) {
        if (req.connection.ldap.bindDN.equals(directory[i].dn)) {
            return next();
        }
    }
    return next(new ldap.InsufficientAccessRightsError());
}

ldapServer.search('dc=mozilla, o=com', [authorize], function(req, res, next) {
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
