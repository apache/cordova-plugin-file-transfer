var http = require('http'),
    util = require('util'),
    port = process.env.PORT || 5000;
    stringify = require('json-stringify-safe'),
    Busboy = require('busboy'),
    inspect = require('util').inspect;

var DIRECT_UPLOAD_LIMIT = 85; // bytes

// convert from UTF-8 to ISO-8859-1
var LATIN1_SYMBOLS = '¥§©ÆÖÑøøø¼';
var Iconv  = require('iconv').Iconv;
var iconv = new Iconv('UTF-8', 'ISO-8859-1');

function parseMultipartForm(req, res, finishCb) {
    var fields = {}, files = {};
    var errorOccured = false;

    var busboy = new Busboy({ headers: req.headers });
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        var currentFile = { size: 0 };
        file.on('data', function(data) {
            currentFile.name = filename;
            currentFile.size += data.length;
        });

        file.on('end', function() {
            files.file = currentFile;
        });
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        fields[fieldname] = val;
    });

    busboy.on('finish', function() {
        console.log(stringify({fields: fields, files: files}));

        // This is needed due to this bug: https://github.com/mscdex/busboy/issues/73
        if (!errorOccured) {
            finishCb(req, res, {fields: fields, files: files});
        }
    });

    busboy.on('error', function(err) {
        console.error('error: ' + err + ': ' + JSON.stringify(err));
        errorOccured = true;

        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end("Could not parse multipart form: " + err + "\n");
    });

    req.pipe(busboy);
}

function respondWithParsedForm(req, res, parseResultObj) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(stringify(parseResultObj));
    res.end("\n");
}

function respondWithParsedFormNonUTF(req, res, parseResultObj) {
    parseResultObj["latin1Symbols"] = LATIN1_SYMBOLS;
    var buffer = iconv.convert(stringify(parseResultObj));
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(buffer);
    res.end("\n");
}

http.createServer(function (req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');

    var basic_auth_username = "cordova_user";
    var basic_auth_password = "cordova_password";

    var header = req.headers['authorization']||'',        // get the header
        token = header.split(/\s+/).pop()||'',            // and the encoded auth token
        auth = new Buffer(token, 'base64').toString(),    // convert from base64
        parts = auth.split(/:/),                          // split on colon
        username = parts[0],
        password = parts[1];

    if (req.url === "/download_basic_auth") {
        if (username != basic_auth_username && password != basic_auth_password) {
            res.writeHead(401, {'Content-Type': 'text/plain'});
            res.end("401\n");
        } else {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write("User-Agent: *\n");
            res.end("Disallow: /\n");
        }
    } else if (req.url === "/robots.txt") {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write("User-Agent: *\n");
        res.end("Disallow: /\n");
    } else if (req.url === "/download_non_utf") {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write("User-Agent: *\n");

        res.write(iconv.convert(LATIN1_SYMBOLS));

        res.end("Disallow: /\n");
    } else if (req.url === "/") {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end("Hello!\n");
    } else if (req.url == '/upload' && (req.method.toLowerCase() == 'post' || req.method.toLowerCase() == 'put')) {
        if(req.headers["content-type"].indexOf("multipart/form-data") === 0) {
            console.log("multipart/form upload");
            parseMultipartForm(req, res, respondWithParsedForm);
        } else {
            console.log("direct upload");
            var body = '';
            req.on('data', function(chunk) {
                body += chunk;
                if (body.length > DIRECT_UPLOAD_LIMIT) { 
                    req.connection.destroy();
                }
            });

            req.on('end', function() {
                console.log('All the data received is: ' + body);
                res.writeHead(200, "OK", {'content-type': 'text/plain'});
                res.write(body);
                res.end();
            });
        }
    } else if (req.url == '/upload_basic_auth' && req.method.toLowerCase() == 'post') {
        if (username != basic_auth_username && password != basic_auth_password) {
            res.writeHead(401, {'Content-Type': 'text/plain'});
            res.end("401\n");
        } else {
            parseMultipartForm(req, res, respondWithParsedForm);
        }
    } else if (req.url == '/upload_non_utf' && req.method.toLowerCase() == 'post') {
        parseMultipartForm(req, res, respondWithParsedFormNonUTF);
    } else if (req.url == '/upload_echo_headers' && req.method.toLowerCase() == 'post') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(stringify(req.headers));
        res.end("\n");
    } else if (req.url.match(/\d{3}/)) {
        var matches = req.url.match(/\d{3}/);
        status = matches[0];
        res.writeHead(status, {'Content-Type': 'text/plain'});
        res.end("You requested a " + status + "\n");
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end("404\n");
    }

    console.log(req.connection.remoteAddress + " " + req.method + " " + req.url + " " + res.statusCode + " " + req.headers['user-agent']);

}).listen(port, '0.0.0.0');
console.log('Server running on ' + port);