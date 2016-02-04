var express = require('express');
var app = express();
var serveIndex = require('serve-index');
var path= require('path');
var open=require('open');
var fs = require('fs');
var php = require('../lib/index.js');
//or
//var php = require('node-express-php');

// give the path to php cgi version
var php_cgi = path.join('c:', 'php', 'php-cgi.exe');
// public directroy with php files
var publicDir = path.join(__dirname,'php');

//note: an index.php is run, if there is none, we show a listing of files zo select
// place before express.bodyParser() !!!
app.use('/php', php(publicDir,php_cgi)); // <--- express route must match the publicDir
//app.use(php(publicDir,php_cgi)); // <-- therefore this won't work
app.use('/php',serveIndex(path.join(__dirname,'php'), { icons:true }));


if (!module.parent) {
    var server = app.listen(3000);
    console.log('Express on http://localhost:3000');
    console.log('visit http://localhost:3000/php and select one of the php scripts you put in the php folder');
    open('http://localhost:3000/php');
} else {
    //for our tests
    module.exports = app;
}
