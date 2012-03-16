var express = require('express');

var app = express.createServer();

app.get('/', function(req, res){
    console.log('well known called');
    res.json({ "authority": "dev.clortho.mozilla.org" });
});

app.listen(3667);