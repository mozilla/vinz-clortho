// Simulate our intranet or any domain behind HTTP Basic Auth
var //connect = require('connect'),
    express = require('express'),
    util = require('util');

var app = express.createServer();

app.use(function (req, resp, next) {

    if ('OPTIONS' === req.method ||
        'GET' === req.method) {
        if ('OPTIONS' === req.method) {
            req.remoteUser = "Skip Connect-BasicAuth";
        }
        if ('https://dev.clortho.mozilla.org' === req.header('origin')) {
            resp.header('Access-Control-Allow-Origin', req.header('origin'));
            resp.header('Access-Control-Allow-Credentials', 'true');
            resp.header('Access-Control-Allow-Headers', 'Authorization');
            console.log('===== boo ya');
        }
    }
    next();
});
app.use(express.basicAuth('aking@mozilla.com', 'oe3yvuvfa9vk7b64i3qm'));

app.get('/', function(req, res){
    console.log('servicing request');
    res.send('Hello');
});

app.listen(3667);