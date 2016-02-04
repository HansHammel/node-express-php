/*
 * node-express-php
 * https://github.com/HansHammel/node-express-php
 *
 * Copyright (c) 2014 https://github.com/HansHammel
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path'),
    fs = require('fs'),
    sanitize = require("sanitize-filename"),
    querystring = require('querystring'),
    spawn = require('child_process').spawn,
    os = require('os'),
    url = require('url');

String.prototype.toCamelCase = function (publicdir) {
    var s = this;
    // uppercase first letter
    s = s.charAt(0).toUpperCase() + s.slice(1);
    // remove all characters that should not be in a variable name
    // as well underscores an numbers from the beginning of the string
    //s = s.replace(/([^a-zA-Z0-9_\- ])|^[_0-9]+/g, "").trim().toLowerCase();
    // uppercase letters preceeded by a hyphen or a space
    s = s.replace(/([ -]+)([a-zA-Z0-9])/g, function (a, b, c) {
        return b + c.toUpperCase();
    });
    // uppercase letters following numbers
    //s = s.replace(/([0-9]+)([a-zA-Z])/g, function(a,b,c) {
    //    return b + c.toUpperCase();
    //});
    return s;
};

function trim_(str) {
    var st = str.replace(/^\s\s*/, ''),
        ws = /\s/,
        i = st.length;
    while (ws.test(st.charAt(--i)));
    return st.slice(0, i + 1);
}

module.exports = function (publicdir, php_cgi) {

    // get raw body
    // conflicts with body parser
    return function (req, res, next) {
        req.rawBody = '';

        req.on('data', function (chunk) {
            req.rawBody += chunk;
        });

        req.on('end', function () {

            var cont = function (filename) {

                var method = req.method || 'GET',
                    query = querystring.stringify(req.query) || '',
                    body = req.rawBody || '';

                //fs.readFile(filename, 'utf8', function (err, str) {
                //    if (err) return fn(err);
                fs.exists(filename, function (exists) {
                    if (exists) {
                        //try {
                        var url_data = url.parse(req.url);
                        var host = (req.headers.host || '').split(':');
                        var php_process = spawn(php_cgi, [' -a ', ' -q ', ' -c ', '"' + __dirname + '"', ' -f ', '"' + filename + '"'], {
                            stdio: ['pipe', 'pipe', 'pipe'], //['pipe', 'pipe', process.stderr],
                            env: {
                                'PHP_VERSION': '', //'5.4.17',
                                'PATH': process.env.PATH,
                                'AUTH_TYPE': '',
                                'CONTENT_LENGTH': body.length,
                                'CONTENT_TYPE': req.headers['content-type'],
                                'DOCUMENT_ROOT': publicdir, //The document root directory under which the current script is executing, as defined in the server's configuration file.
                                'GATEWAY_INTERFACE': 'CGI/1.1',
                                'HTTPS': req.secure ? 'true' : '', // 'on' : 'off'
                                'HTTP_ACCEPT': req.headers['accept'],
                                'HTTP_ACCEPT_CHARSET': req.headers['accept-ccharset'],
                                'HTTP_ACCEPT_ENCODING': req.headers['accept-encoding'],
                                'HTTP_ACCEPT_LANGUAGE': req.headers['accept-language'],
                                'HTTP_CACHE_CONTROL': req.headers['cache-control'],
                                'HTTP_CONNECTION': req.headers['connection'],
                                'HTTP_COOKIE': req.headers['cookie'],
                                'HTTP_HOST': req.headers['host'],
                                'HTTP_KEEP_ALIVE': req.headers['keep-alive'],
                                'HTTP_REFERER': req.headers['referer'],
                                'HTTP_USER_AGENT': req.header('user-agent'),
                                'ORIG_PATH_INFO': '', // req.originalUrl
                                'PATH_INFO': '', //Enth�lt, sofern vorhanden, den Teil des Pfadnamens hinter dem Namen des PHP-Skripts, aber vor dem Query-String. Wenn zum Beispiel das aktuelle Skript mittels dem URL http://www.example.com/php/path_info.php/some/stuff?foo=bar aufgerufen wird, w�rde $_SERVER['PATH_INFO'] /some/stuff enthalten.
                                'PATH_TRANSLATED': filename, //Filesystem- (not document root-) based path to the current script, after the server has done any virtual-to-real mapping.
                                'PHP_AUTH_DIGEST': '', //When doing Digest HTTP authentication this variable is set to the 'Authorization' header sent by the client (which you should then use to make the appropriate validation).
                                'PHP_AUTH_PW': url_data.auth ? url_data.auth.split(':')[1] : '', //When doing HTTP authentication this variable is set to the password provided by the user.
                                'PHP_AUTH_USER': url_data.auth ? url_data.auth.split(':')[0] : '', //When doing HTTP authentication this variable is set to the username provided by the user.
                                'PHP_SELF': '', //path.relative(publicdir, filename).replace(/\\/g,'/'),
                                'QUERY_STRING': query,
                                'REDIRECT_REMOTE_USER': '', //The authenticated user if the request is internally redirected.
                                'REDIRECT_STATUS': 1,
                                'REMOTE_ADDR': req.ip,
                                'REMOTE_HOST': '', //dns lookup or ip
                                'REMOTE_PORT': '', //The port being used on the user's machine to communicate with the web server.
                                'REMOTE_USER': '', //The authenticated user.
                                'REQUEST_METHOD': method,
                                'REQUEST_TIME': '', //The timestamp of the start of the request. Available since PHP 5.1.0.
                                'REQUEST_TIME_FLOAT': '', //The timestamp of the start of the request, with microsecond precision. Available since PHP 5.4.0.
                                'REQUEST_URI': decodeURIComponent(url.parse(req.url).pathname),
                                'SCRIPT_FILENAME': filename,
                                'SCRIPT_NAME': filename,
                                'SERVER_ADDR': '', //ip
                                'SERVER_ADMIN': 'me',
                                'SERVER_NAME': host[0] || 'localhost', //
                                'SERVER_PORT': host[0] || app.get('port') || 80,
                                'SERVER_PROTOCOL': req.protocol.toUpperCase() + '/1.1', //'HTTP/1.1' Name and revision of the information protocol via which the page was requested; i.e. 'HTTP/1.0';
                                'SERVER_SIGNATURE': '',
                                'SERVER_SOFTWARE': 'Node/' + process.version

                                //'HTTP_X_ORIGINAL_URL': '',
                                //'HTTP_X_REWRITE_URL': '',
                                // remove X- from non standard headers as section 5 of RFC 2047 suggested
                                //'X_ORIGINAL_URL': '',
                                //'X_REWRITE_URL': '',

                                //'HTTP_ACCEPT': 'text/html, application/xhtml+xml, */*',
                                //'HTTP_ACCEPT_ENCODING': 'gzip',
                                //'HTTP_ACCEPT_LANGUAGE': 'de-DE',
                                //'HTTP_ACCESS_CONTROL_ALLOW_HEADERS': '',
                                //'HTTP_ACCESS_CONTROL_ALLOW_METHODS': 'GET, POST, OPTIONS',
                                //'HTTP_ACCESS_CONTROL_ALLOW_ORIGIN': '*',
                                //'HTTP_ACCESS_CONTROL_EXPOSE_HEADERS': '',
                                //'HTTP_AUTHORIZATION': 'Basic ************',
                                //'HTTP_CF_CONNECTING_IP': '93.208.228.123',
                                //'HTTP_CF_IPCOUNTRY': 'DE',
                                //'HTTP_CF_RAY': '105f9ae46ea30461-FRA',
                                //'HTTP_CF_VISITOR': '{\"scheme\":\"http\"}',
                                //'HTTP_CONNECTION': 'Keep-Alive',
                                //'HTTP_CONTENT_LENGTH': '0',
                                //'HTTP_DNT': '1',
                                //'HTTP_HOST': 'samsclass.info',
                                //'HTTP_REFERER': 'http://www.google.de/url?sa=t&rct=j&q=&esrc=s&source=web&cd=4&ved=0CEcQFjAD&url=http%3A%2F%2Fwww.gcwebstudio.com%2Ftest%2Fphp%2Ftest.php%3F1382325587000&ei=gwgWU5vCEsjkswav5oCACQ&usg=AFQjCNFCEno9G9UlkKOV1E28410uwoyhrw&bvm=bv.62286460,d.Yms',
                                //'HTTP_USER_AGENT': 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
                                //'HTTP_X_FORWARDED_FOR': '93.208.228.123',
                                //'HTTP_X_FORWARDED_PROTO': 'http',
                                //'HTTP_X_VARNISH': '1267724470',

                                //'DBENTRY': '/kunden/homepages/26/d151235451/htdocs:d0000#CPU 6 #MEM 10240 #CGI 18 #NPROC 12 #TAID 39626015 #WERB 0 #LANG 3 #PARKING 1',
                                //'DBENTRY_HOST': 'samsclass.info',
                                //'REDIRECT_DOCUMENT_ROOT': '/kunden/homepages/26/d151235451/htdocs',
                                //'REDIRECT_HANDLER': 'x-mapp-php4',
                                //'REDIRECT_SCRIPT_URI': 'http://samsclass.info/header.php',
                                //'REDIRECT_SCRIPT_URL': '/header.php',
                                //'REDIRECT_STATUS': '200',
                                //'REDIRECT_UI_SUEXEC_FSTATD_UNIXSOCKET': '/var/run/ui-fstatd.suexec.socket',
                                //'REDIRECT_UNIQUE_ID': 'UxYFpQouc5AAAD34oigAAABO',
                                //'REDIRECT_URI': '/mysite.fcgi/message/',
                                //'REDIRECT_URL': '/header.php',
                                //'REMOTE_ADDR': '108.162.254.232',
                                //'REMOTE_ADDR': '67.188.41.104',
                                //'REMOTE_PORT': '35608',
                                //'REMOTE_PORT': '58963',
                                //'REQUEST_METHOD': 'GET',
                                //'REQUEST_SCHEME': 'http',
                                //'REQUEST_TIME': '1393953339
                                //'REQUEST_TIME_FLOAT': '1393953339.3166',
                                //'REQUEST_URI': '/test/php/test.php?1382325587000',
                                //'SCRIPT_FILENAME': '/kunden/homepages/26/d151235451/htdocs/header.php',
                                //'SCRIPT_NAME': '/header.php',
                                //'SCRIPT_URI': 'http://samsclass.info/header.php',
                                //'SCRIPT_URL': '/header.php',
                                //'SERVER_ADDR': '10.254.105.188',
                                //'SERVER_ADMIN': 'webmaster@samsclass.info',
                                //'SERVER_NAME': 'dev.rf.com', //'samsclass.info',
                                //'SERVER_PORT': '443',
                                //'SERVER_PROTOCOL': 'HTTP/1.1',
                                //'STATUS': '200',
                                //'UNIQUE_ID': 'UxYFpQouc5AAAD34oigAAABO',

                                //'ACCEPT': '', //'Accept'   ' SHOULD. (input) ',: '',
                                //'ACCEPT_CHARSET': '', //'Accept-Charset'   ' SHOULD/MAY (says': '',
                                //'ACCEPT_ENCODING': '', //'Accept-Encoding'   ' SHOULD. (input) ',: '',
                                //'ACCEPT_LANGUAGE': '', //'Accept-Language'   ' MAY. (input) ',: '',
                                //'ACCEPT_RANGES': '', //'Accept-Ranges'   ' MAY. (output) ',: '',
                                //'AGE': '', //'Age'   ' MAY. MUST if server caches data. (output) ',: '',
                                //'ALLOW': '', //'Allow'   ' MAY. MUST when using 405 return code. (output) ',: '',
                                //'AUTHORIZATION': '', //'Authorization'   ' MAY. (input) ',: '',
                                //'CACHE_CONTROL': '', //'Cache-Control'   ' MAY. (output) ',: '',
                                //'CONNECTION': '', //'Connection'   ' MUST. (input) (output) ',: '',
                                //'CONTENT_ENCODING': '', //'Content-Encoding'   ' MAY. (output) ',: '',
                                //'CONTENT_LANGUAGE': '', //'Content-Language'   ' MAY. (output) ',: '',
                                //'CONTENT_LENGTH': '', //'Content-Length'   ' MUST. (input) (output)',: '',
                                //'CONTENT_LOCATION': '', //'Content-Location'   ' MAY. SHOULD when using variant entities. (output) NOTE': '',
                                //'CONTENT_MD5': '', //'Content-MD5'   ' MAY. (input) (output) ',: '',
                                //'CONTENT_RANGE': '', //'Content-Range'   ' MAY. SHOULD when using 416 return code. (output) ',: '',
                                //'CONTENT_SECURITY_POLICY': '', //'Content-Security-Policy'   '',: '',
                                //'CONTENT_TYPE': '', //'Content-Type'   ' SHOULD. (output) ',: '',
                                //'CONTENT_TYPE_OPTIONS': '', //'Content-Type-Options'   'The only defined value, "nosniff", prevents Internet Explorer from MIME-sniffing a response away from the declared content-type. This also applies to Google Chrome, when downloading extensions.[34] X-Content-Type-Options: nosniff ',: '',
                                //'DATE': '', //'Date'   ' MUST. (output) ',: '',
                                //'ETAG': '', //'ETag'   ' MAY. (output) ',: '',
                                //'EXPECT': '', //'Expect'   ' MUST. (input) ',: '',
                                //'EXPIRES': '', //'Expires'   ' MAY. (output) ',: '',
                                //'FRAME_OPTIONS': '', //'Frame-Options'   '',: '',
                                //'FRAME_OPTIONS': '', //'Frame-Options'   'Clickjacking protection: "deny" - no rendering within a frame, "sameorigin" - no rendering if origin mismatch X-Frame-Options: deny ',: '',
                                //'FROM': '', //'From'   ' MAY. (input) ',: '',
                                //'HOST': '', //'Host'   ' MUST. (input) ',: '',
                                //'IF_MATCH': '', //'If-Match'   ' MUST. (input) ',: '',
                                //'IF_MODIFIED_SINCE': '', //'If-Modified-Since'   ' MUST. (input) ',: '',
                                //'IF_NONE_MATCH': '', //'If-None-Match'   ' MUST. (input) ',: '',
                                //'IF_RANGE': '', //'If-Range'   ' SHOULD. (input) ',: '',
                                //'IF_UNMODIFIED_SINCE': '', //'If-Unmodified-Since'   ' MUST. (input) ',: '',
                                //'LAST_MODIFIED': '', //'Last-Modified'   ' SHOULD. (output) ',: '',
                                //'LOCATION': '', //'Location'   ' MUST for 201 return code. SHOULD for 3xx return codes. (output) ',: '',
                                //'MAX_FORWARDS': '', //'Max-Forwards'   ' PROXY ONLY': '',
                                //'POWERED_BY': '', //'Powered-By'   'specifies the technology (e.g. ASP.NET, PHP, JBoss) supporting the web application (version details are often in X-Runtime, X-Version, or X-AspNet-Version) X-Powered-By: PHP/5.4.0 ',: '',
                                //'PRAGMA': '', //'Pragma'   ' PROXY ONLY': '',
                                //'PROXY_AUTHENTICATE': '', //'Proxy-Authenticate'   ' PROXY ONLY': '',
                                //'PROXY_AUTHORIZATION': '', //'Proxy-Authorization'   ' PROXY ONLY': '',
                                //'RANGE': '', //'Range'   ' SHOULD. (input) ',: '',
                                //'REFERER': '', //'Referer'   ' MAY. (input) ',: '',
                                //'RETRY_AFTER': '', //'Retry-After'   ' MAY with 503 and 3xx return codes. (output) ',: '',
                                //'SERVER': '', //'Server'   ' MUST. (output) ',: '',
                                //'TE': '', //'TE'   ' MAY. (input) ',: '',
                                //'TRAILER': '', //'Trailer'   ' MUST NOT. SHOULD when using chunked encoding. (output) ',: '',
                                //'TRANSFER_ENCODING': '', //'Transfer-Encoding'   ' MAY. (output) MUST. (input) ',: '',
                                //'UA_COMPATIBLE': '', //'UA-Compatible'   '', //Chrome=1 IE=edge Recommends the preferred rendering engine (often a backward-compatibility mode) to use to display the content. Also used to activate Chrome Frame in Internet Explorer. X-UA-Compatible: IE=EmulateIE7',: '',
                                //'UPGRADE': '', //'Upgrade'   ' MAY. (input) MUST when using 101 return code. (output) ',: '',
                                //'USER_AGENT': '', //'User-Agent'   ' MAY (input) ',: '',
                                //'VARY': '', //'Vary'   ' MAY, SHOULD depending on cachability. (output) ',: '',
                                //'VIA': '', //'Via'   ' MAY, MUST when getting data from another server. (output) ',: '',
                                //'WWW_AUTHENTICATE': '', //'WWW-Authenticate'   ' MAY, MUST when using 401 return code. (output) ',: '',
                                //'WARNING': '', //'Warning'   ' MAY. (output) ',: '',
                                //'WEBKIT_CSP': '', //'WebKit-CSP'   'Content Security Policy definition. X-WebKit-CSP: default-src 'self' ',: '',
                                //'X_CONTENT_SECURITY_POLICY': '', //'X-Content-Security-Policy'   '',: '',
                                //'X_CONTENT_TYPE_OPTIONS': '', //'X-Content-Type-Options'   'The only defined value, "nosniff", prevents Internet Explorer from MIME-sniffing a response away from the declared content-type. This also applies to Google Chrome, when downloading extensions.[34] X-Content-Type-Options: nosniff ',: '',
                                //'X_FRAME_OPTIONS': '', //'X-Frame-Options'   '',: '',
                                //'X_FRAME_OPTIONS': '', //'X-Frame-Options'   'Clickjacking protection: "deny" - no rendering within a frame, "sameorigin" - no rendering if origin mismatch X-Frame-Options: deny ',: '',
                                //'X_POWERED_BY': '', //'X-Powered-By'   'specifies the technology (e.g. ASP.NET, PHP, JBoss) supporting the web application (version details are often in X-Runtime, X-Version, or X-AspNet-Version) X-Powered-By: PHP/5.4.0 ',: '',
                                //'X_UA_COMPATIBLE': '', //'X-UA-Compatible'   '',: '',
                                //'X_UA_COMPATIBLE': '', //'X-UA-Compatible'   'Chrome=1 ',: '',
                                //'X_UA_COMPATIBLE': '', //'X-UA-Compatible'   'IE=edge',: '',
                                //'X_UA_COMPATIBLE': '', //'X-UA-Compatible'   'Recommends the preferred rendering engine (often a backward-compatibility mode) to use to display the content. Also used to activate Chrome Frame in Internet Explorer. X-UA-Compatible: IE=EmulateIE7',: '',
                                //'X_WEBKIT_CSP': '', //'X-WebKit-CSP'   'Content Security Policy definition. X-WebKit-CSP: default-src 'self' ',: '',
                                //'X_XSS_PROTECTION': '', //'X-XSS-Protection'   'Cross-site scripting (XSS) filter X-XSS-Protection: 1; mode=block ',: '',
                                //'XSS_PROTECTION': '', //'XSS-Protection'   'Cross-site scripting (XSS) filter X-XSS-Protection: 1; mode=block ',: '',
                                //'X_FORWARDED_FOR': '', //'x-forwarded-for'   'Originating IP of a client connection to the server ',: '',
                                //'X_FORWARDED_HOST': '', //'x-forwarded-host'   'Origination host name ',: '',
                                //'X_FORWARDED_SERVER': '', //'x-forwarded-server'   'Originating server name ',: '',

                                //'HTTP_ACCEPT': '', //'Accept'   ' SHOULD. (input) ',: '',
                                //'HTTP_ACCEPT_CHARSET': '', //'Accept-Charset'   ' SHOULD/MAY (says': '',
                                //'HTTP_ACCEPT_ENCODING': '', //'Accept-Encoding'   ' SHOULD. (input) ',: '',
                                //'HTTP_ACCEPT_LANGUAGE': '', //'Accept-Language'   ' MAY. (input) ',: '',
                                //'HTTP_ACCEPT_RANGES': '', //'Accept-Ranges'   ' MAY. (output) ',: '',
                                //'HTTP_AGE': '', //'Age'   ' MAY. MUST if server caches data. (output) ',: '',
                                //'HTTP_ALLOW': '', //'Allow'   ' MAY. MUST when using 405 return code. (output) ',: '',
                                //'HTTP_AUTHORIZATION': '', //'Authorization'   ' MAY. (input) ',: '',
                                //'HTTP_CACHE_CONTROL': '', //'Cache-Control'   ' MAY. (output) ',: '',
                                //'HTTP_CONNECTION': '', //'Connection'   ' MUST. (input) (output) ',: '',
                                //'HTTP_CONTENT_ENCODING': '', //'Content-Encoding'   ' MAY. (output) ',: '',
                                //'HTTP_CONTENT_LANGUAGE': '', //'Content-Language'   ' MAY. (output) ',: '',
                                //'HTTP_CONTENT_LENGTH': '', //'Content-Length'   ' MUST. (input) (output)',: '',
                                //'HTTP_CONTENT_LOCATION': '', //'Content-Location'   ' MAY. SHOULD when using variant entities. (output) NOTE': '',
                                //'HTTP_CONTENT_MD5': '', //'Content-MD5'   ' MAY. (input) (output) ',: '',
                                //'HTTP_CONTENT_RANGE': '', //'Content-Range'   ' MAY. SHOULD when using 416 return code. (output) ',: '',
                                //'HTTP_CONTENT_SECURITY_POLICY': '', //'Content-Security-Policy'   '',: '',
                                //'HTTP_CONTENT_TYPE': '', //'Content-Type'   ' SHOULD. (output) ',: '',
                                //'HTTP_CONTENT_TYPE_OPTIONS': '', //'Content-Type-Options'   'The only defined value, "nosniff", prevents Internet Explorer from MIME-sniffing a response away from the declared content-type. This also applies to Google Chrome, when downloading extensions.[34] X-Content-Type-Options: nosniff ',: '',
                                //'HTTP_DATE': '', //'Date'   ' MUST. (output) ',: '',
                                //'HTTP_ETAG': '', //'ETag'   ' MAY. (output) ',: '',
                                //'HTTP_EXPECT': '', //'Expect'   ' MUST. (input) ',: '',
                                //'HTTP_EXPIRES': '', //'Expires'   ' MAY. (output) ',: '',
                                //'HTTP_FRAME_OPTIONS': '', //'Frame-Options'   '',: '',
                                //'HTTP_FRAME_OPTIONS': '', //'Frame-Options'   'Clickjacking protection: "deny" - no rendering within a frame, "sameorigin" - no rendering if origin mismatch X-Frame-Options: deny ',: '',
                                //'HTTP_FROM': '', //'From'   ' MAY. (input) ',: '',
                                //'HTTP_HOST': '', //'Host'   ' MUST. (input) ',: '',
                                //'HTTP_IF_MATCH': '', //'If-Match'   ' MUST. (input) ',: '',
                                //'HTTP_IF_MODIFIED_SINCE': '', //'If-Modified-Since'   ' MUST. (input) ',: '',
                                //'HTTP_IF_NONE_MATCH': '', //'If-None-Match'   ' MUST. (input) ',: '',
                                //'HTTP_IF_RANGE': '', //'If-Range'   ' SHOULD. (input) ',: '',
                                //'HTTP_IF_UNMODIFIED_SINCE': '', //'If-Unmodified-Since'   ' MUST. (input) ',: '',
                                //'HTTP_LAST_MODIFIED': '', //'Last-Modified'   ' SHOULD. (output) ',: '',
                                //'HTTP_LOCATION': '', //'Location'   ' MUST for 201 return code. SHOULD for 3xx return codes. (output) ',: '',
                                //'HTTP_MAX_FORWARDS': '', //'Max-Forwards'   ' PROXY ONLY': '',
                                //'HTTP_POWERED_BY': '', //'Powered-By'   'specifies the technology (e.g. ASP.NET, PHP, JBoss) supporting the web application (version details are often in X-Runtime, X-Version, or X-AspNet-Version) X-Powered-By: PHP/5.4.0 ',: '',
                                //'HTTP_PRAGMA': '', //'Pragma'   ' PROXY ONLY': '',
                                //'HTTP_PROXY_AUTHENTICATE': '', //'Proxy-Authenticate'   ' PROXY ONLY': '',
                                //'HTTP_PROXY_AUTHORIZATION': '', //'Proxy-Authorization'   ' PROXY ONLY': '',
                                //'HTTP_RANGE': '', //'Range'   ' SHOULD. (input) ',: '',
                                //'HTTP_REFERER': '', //'Referer'   ' MAY. (input) ',: '',
                                //'HTTP_RETRY_AFTER': '', //'Retry-After'   ' MAY with 503 and 3xx return codes. (output) ',: '',
                                //'HTTP_SERVER': '', //'Server'   ' MUST. (output) ',: '',
                                //'HTTP_TE': '', //'TE'   ' MAY. (input) ',: '',
                                //'HTTP_TRAILER': '', //'Trailer'   ' MUST NOT. SHOULD when using chunked encoding. (output) ',: '',
                                //'HTTP_TRANSFER_ENCODING': '', //'Transfer-Encoding'   ' MAY. (output) MUST. (input) ',: '',
                                //'HTTP_UA_COMPATIBLE': '', //'UA-Compatible'   '', //Chrome=1 IE=edge Recommends the preferred rendering engine (often a backward-compatibility mode) to use to display the content. Also used to activate Chrome Frame in Internet Explorer. X-UA-Compatible: IE=EmulateIE7',: '',
                                //'HTTP_UPGRADE': '', //'Upgrade'   ' MAY. (input) MUST when using 101 return code. (output) ',: '',
                                //'HTTP_USER_AGENT': '', //'User-Agent'   ' MAY (input) ',: '',
                                //'HTTP_VARY': '', //'Vary'   ' MAY, SHOULD depending on cachability. (output) ',: '',
                                //'HTTP_VIA': '', //'Via'   ' MAY, MUST when getting data from another server. (output) ',: '',
                                //'HTTP_WWW_AUTHENTICATE': '', //'WWW-Authenticate'   ' MAY, MUST when using 401 return code. (output) ',: '',
                                //'HTTP_WARNING': '', //'Warning'   ' MAY. (output) ',: '',
                                //'HTTP_WEBKIT_CSP': '', //'WebKit-CSP'   'Content Security Policy definition. X-WebKit-CSP: default-src 'self' ',: '',
                                //'HTTP_X_CONTENT_SECURITY_POLICY': '', //'X-Content-Security-Policy'   '',: '',
                                //'HTTP_X_CONTENT_TYPE_OPTIONS': '', //'X-Content-Type-Options'   'The only defined value, "nosniff", prevents Internet Explorer from MIME-sniffing a response away from the declared content-type. This also applies to Google Chrome, when downloading extensions.[34] X-Content-Type-Options: nosniff ',: '',
                                //'HTTP_X_FRAME_OPTIONS': '', //'X-Frame-Options'   '',: '',
                                //'HTTP_X_FRAME_OPTIONS': '', //'X-Frame-Options'   'Clickjacking protection: "deny" - no rendering within a frame, "sameorigin" - no rendering if origin mismatch X-Frame-Options: deny ',: '',
                                //'HTTP_X_POWERED_BY': '', //'X-Powered-By'   'specifies the technology (e.g. ASP.NET, PHP, JBoss) supporting the web application (version details are often in X-Runtime, X-Version, or X-AspNet-Version) X-Powered-By: PHP/5.4.0 ',: '',
                                //'HTTP_X_UA_COMPATIBLE': '', //'X-UA-Compatible'   '',: '',
                                //'HTTP_X_UA_COMPATIBLE': '', //'X-UA-Compatible'   'Chrome=1 ',: '',
                                //'HTTP_X_UA_COMPATIBLE': '', //'X-UA-Compatible'   'IE=edge',: '',
                                //'HTTP_X_UA_COMPATIBLE': '', //'X-UA-Compatible'   'Recommends the preferred rendering engine (often a backward-compatibility mode) to use to display the content. Also used to activate Chrome Frame in Internet Explorer. X-UA-Compatible: IE=EmulateIE7',: '',
                                //'HTTP_X_WEBKIT_CSP': '', //'X-WebKit-CSP'   'Content Security Policy definition. X-WebKit-CSP: default-src 'self' ',: '',
                                //'HTTP_X_XSS_PROTECTION': '', //'X-XSS-Protection'   'Cross-site scripting (XSS) filter X-XSS-Protection: 1; mode=block ',: '',
                                //'HTTP_XSS_PROTECTION': '', //'XSS-Protection'   'Cross-site scripting (XSS) filter X-XSS-Protection: 1; mode=block ',: '',
                                //'HTTP_X_FORWARDED_FOR': '', //'x-forwarded-for'   'Originating IP of a client connection to the server ',: '',
                                //'HTTP_X_FORWARDED_HOST': '', //'x-forwarded-host'   'Origination host name ',: '',
                                //'HTTP_X_FORWARDED_SERVER': '', //'x-forwarded-server'   'Originating server name ',: '',

                            }
                        });

                        php_process.stdin.write(body);
                        php_process.stdin.end();

                        var out = '';
                        php_process.stdout.on('data', function (data) {
                            out += data;
                        });

                        php_process.stderr.on('data', function (data) {
                            console.log(data);
                            /*
                             if (data.toString().indexOf('PHP Notice:') === 0)
                             {
                             console.log(data);
                             } else
                             if (data.toString().indexOf('PHP Fatal error:') === 0)
                             {
                             console.log(data);
                             } else
                             {
                             console.log(data);
                             }
                             */
                        });

                        //php_process.on('exit', function (code) {
                        //console.log(code);
                        //});

                        php_process.on('close', function (code) {
                            // get staus number from returned header
                            //var regex = /^Status: ?([0-9]+).*$/g;
                            //var regex = /^Status: ?([0-9]+)/m;
                            var regex = /^Status:\s*(\d{3}) (.*)$/mi;
                            var result = (out.substr(0, out.indexOf(os.EOL + os.EOL))).match(regex);
                            var statusNumber = result ? result[1] : 200;
                            var reason = result ? result[2] : '';
                            var rrr = function (str) {
                                var result = {};
                                str.split(os.EOL).forEach(function (x) {
                                    var arr = x.split(': ');
                                    //arr.forEach(function(y){ y = trim_(y);});
                                    arr[1] && (result[trim_(arr[0]).toCamelCase()] = trim_(arr[1]));
                                });
                                return result;
                            };

                            var bar = rrr(out.substr(0, out.indexOf(os.EOL + os.EOL)));
                            // wp fix only for testing
                            if (bar['Location']) {
                                bar['Location'] = bar['Location'].replace(/localhost/, req.host);
                            }
                            if (bar['Status']) {
                                delete bar['Status'];
                            }

                            // todo: this is a very bad hack !!!
                            // using the message field on writehead to inject our raw php header
                            // see the sample below, how to pass a header object
                            res.writeHead(statusNumber, ' ' + reason + os.EOL + out.substr(0, out.indexOf(os.EOL + os.EOL)));

                            // write the body
                            res.write(out.substr(out.indexOf(os.EOL + os.EOL)));
                            res.end();

                        });

                    }
                });
            };

            var checkforphpfile = function (_path) {
                if (fs.existsSync(_path)) {
                    // and exists
                    if (fs.lstatSync(_path).isFile()) {
                        // and is a file
                        //res.contentType(mime.lookup(_path));
                        cont(_path);
                    }
                    else {
                        // and is a folder
                        // so check for a index.php
                        var d = path.join(_path, 'index.php');
                        if (fs.existsSync(d) && fs.lstatSync(d).isFile()) {
                            // has an index.php
                            //res.contentType(mime.lookup(d));
                            decodeURIComponent(url.parse(req.url).pathname).endsWith('/') ?
                                // if it ends with / render it
                                cont(d) :
                                // or we redirect bla to bla/index.php
                                res.redirect(301, decodeURIComponent(url.parse(req.url).pathname) + (decodeURIComponent(url.parse(req.url).pathname).endsWith('/') ? '' : '/') + 'index.php' + (url.parse(req.url).search || '') + (url.parse(req.url).hash || ''));
                            //cont(d);
                        }
                        else {
                            // not found
                            // go on
                            next();
                        }
                    }
                }
                else {
                    // and does not exist
                    // so go on
                    next();
                }
            };

            var r = decodeURIComponent(url.parse(req.url).pathname);
            var p = path.join(publicdir, r.split('/').map(sanitize).join('/'));
            if (p.substr(-4).toLowerCase() === '.php') {
                // has .php ending
                checkforphpfile(p);
            }
            else {
                // has no .php ending
                if (fs.existsSync(p)) {
                    // and exists
                    if (fs.lstatSync(p).isFile()) {
                        // and is a file
                        // so go on
                        next();
                        // res.contentType(mime.lookup(p));
                        // cont(p);
                    }
                    else {
                        // and is a folder
                        // so check for an index.php
                        var d = path.join(p, 'index.php');
                        if (fs.existsSync(d) && fs.lstatSync(d).isFile()) {
                            // has an index.php
                            decodeURIComponent(url.parse(req.url).pathname).endsWith('/') ?
                                // if it ends with / render it
                                cont(d) :
                                // or we redirect bla to bla/index.php
                                res.redirect(301, decodeURIComponent(url.parse(req.url).pathname) + (decodeURIComponent(url.parse(req.url).pathname).endsWith('/') ? '' : '/') + 'index.php' + (url.parse(req.url).search || '') + (url.parse(req.url).hash || ''));
                            //cont(d);
                        }
                        else {
                            // not found, so go on
                            next();
                        }
                    }
                }
                else {
                    // and does not exist
                    // so check if there is a php file
                    checkforphpfile(p + '.php');
                }
            }
        });
    };
};
