var socketio = require('socket.io');
var dbInit = require('./init_db.js');
var io;
var request = require('request');
var mysql = require('mysql');
/**
 * Substitute ****YOURS***** on your data
 *
 * Example:
 *
 * cliendId    = '12345';
 * secureKey   = 'H8X123G45F';
 * redirectUri = 'http://localhost:3000/vklogin.html';
 *
 * host     : 'localhost',
 * port     : '3306',
 * user     : 'root',
 * password : '1234'
 */
var clientId    = '  ****YOURS*****  ';
var secureKey   = '  ****YOURS*****  ';
var redirectUri = '  ****YOURS*****  ';
var dbConnect = mysql.createConnection({
  host               : '  ****YOURS*****  ',
  port               : '  ****YOURS*****  ',
  user               : '  ****YOURS*****  ',
  password           : '  ****YOURS*****  ',
  charset            : 'utf8',
  multipleStatements : true
});

/**
 * Socket listener.
 *
 * @param {object} server
 * @public
 */
exports.listen = function(server) {

  io = socketio.listen(server);
  io.set('log level', 1);

  io.sockets.on('connection', function listenConnection(socket) {

    socket.on('post the code', processingReceivedCode);

    /**
     * Callback for socket emit 'post the code'
     *
     * @param {string} code [Code from VK OAuth]
     * @private
     */
    function processingReceivedCode(code) {

      // Reference for request to access token and user id.
      var href = 'https://oauth.vk.com/access_token?' +
                 'client_id=' + clientId +
                 '&' +
                 'client_secret=' + secureKey +
                 '&' +
                 'redirect_uri=' + redirectUri +
                 '&' +
                 code;

      request.get(href, getAccessToken);
    }

    /**
     * Callback for request method 'get'.
     *
     * @param {object} err
     * @param {object} res
     * @param {string} body [JSON Object]
     * @private
     */
    function getAccessToken(err, res, body) {
      if (!err && res.statusCode == 200) {

        // Redirected to search.html when get access token.
        socket.emit('go to search page');

        // data equal object like { 'access_token': ..., 'id_user': ... }
        var data = JSON.parse(body);
        var dbName = 'db' + data.user_id;

        dbInit.init(dbConnect, dbName, data.user_id, data.access_token);
      }
    };

    socket.on('find post', findPostFromWord);

    /**
     * Callback for socket emit 'find post'
     *
     * @param {string} code [Code from VK OAuth]
     * @private
     */
    function findPostFromWord(data) {
      var find = 'SELECT users.*, posts.* FROM posts ' +
                 'INNER JOIN users ' +
                 'ON (users.id_user=posts.id_author) ' +
                 'WHERE MATCH(posts.text) ' +
                 'AGAINST(\'' + data + '\'); ';
      dbConnect.query(find, sendFoundFromDb);
    }

    /**
     * Callback for mysql method 'query'.
     *
     * @param {object} err
     * @param {object} res
     * @private
     */
    function sendFoundFromDb(err, res) {
        socket.emit('show', res);
    }

  });
}
