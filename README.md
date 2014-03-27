node-express-php
================

php middleware for express operating as cgi script for fast php integration on development environments, for production please use nginx, iis or apache with php

Installation
============

	git clone git://github.com/HansHammel/node-express-php.git
	npm install

or

    npm install "git+https://git@github.com/HansHammel/node-express-php.git" --save

supports:
- executes php-cgi.exe as cgi script (works on windows, should work on linux, too)
- correct handling of directories and special characters in path and query
- sets environment variables according to the cgi specifications (no clumsy php loader script)
- works for all headers and all http methods (not only get and post)
- full query parameter support
- works even for ajax (maybe WebSockets, but untested)
- uses php.ini (required)
- supports hierarchical folder structures and
- defaults to index.php if exists
- tested with [wdCalendar](https://github.com/ronisaha/wdCalendar) (google calender clone) - get, post and ajax work!

_tip: partial support for wordpress_
- _only site content does not work due to the lack of htaccess/ rewrite support_
- _needs some config in wp-config.php to work, e.g._
    * _define('WP_HOME','http://localhost:3000/wordpress');_
    * _define('WP_SITEURL','http://localhost:3000/wordpress');_
- _install procedure may require some manual adjustment to the url, especially when using a port other than 80_

Usage
=====

**create a `php.ini` file (you can use the sample provided) in the root of your project (where yo do node app.js)**

php.ini - required settings - restrictions:
- output_buffering = 32768 (must NOT be truned off)
- zlib.output_compression = Off
- implicit_flush = Off
- display_errors = stderr
- html_errors = Off
- default_mimetype = "text/html"
- default_charset = "UTF-8"

_tip: dont forget to adjust `upload_max_filesize` and `post_max_size` for large uploads and enable the desired extensions like
`extension=ext/php_mysql.dll`_

**use as express middleware**

```javascript
var php = require('../node-express-php'),
    // give the path to php cgi version
	php_cgi = path.join('c:', 'php', 'php-cgi.exe')
	// use php on public directroy
	publicDir = path.join(__dirname, 'public');

// place before express.bodyParser() !!!
app.use(php(publicDir,php_cgi));
```

Known issues
============

- paths like /bla.php/somepath?q=search (seo friendly url, nice permalinks) do not work
- some php.ini settings are required, see above (not fully tested)
- larger uploads are precached in memory and not streamed to php-cgi -> high memory usage, long script runtime (increase `max_execution_time`)
- large posts lead to EOF maybe related to output buffering
- lack of rewrite rules may lead to problems like `somepath/index.php` != `/somepath` != `/somepath/index` != `/somepath/`
- wordpress edit.php not working

Contribution
============

if you would like to help improving this module, please:
- write tests
- help debugging/ solving the known issues
- send bug fixes/ pull request
- if you use this module, provide a link for reference

Changelog
=========
