var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var appServer = require('./lib/app_server');
var cache = {};

/**
 * Show 404 message if not exist.
 *
 * @param {object} response
 * @private
 */
function send404(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain' });
  response.write('Error 404: resource not found');
  response.end();
}

/**
 * Send file to client.
 *
 * @param {object} response
 * @param {string} filePath
 * @param {string} fileContents
 * @private
 */
function sendFile(response, filePath, fileContents) {
  response.writeHead(
    200,
    { 'contet-type': mime.lookup(path.basename(filePath)) }
  );
  response.end(fileContents);
}

/**
 * Add file to cache if not exist.
 *
 * @param {object} response
 * @param {object} filePath
 * @param {string} absFile
 * @private
 */
function serveStatic(response, cache, absPath) {
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    fs.exists(absPath, function(exists) {
      if (exists) {
        fs.readFile(absPath, function(err, data) {
          if (err) {
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        });
      } else {
        send404(response);
      }
    });
  }
}

var server = http.createServer(function(request, response) {
  var absPath = false;
  var filePath = false;

  if (request.url === '/') {
    filePath = 'src/index.html';
  } else if (~request.url.search(/lib|socket/)) {
    filePath = request.url;
  } else if (~request.url.search(/vklogin/)) {
    filePath = 'src/vklogin.html';
  } else {
    filePath = 'src' + request.url;
  }

  absPath = './' + filePath;
  serveStatic(response, cache, absPath);
});

server.listen(3000);

// Run the socket
appServer.listen(server);
