var request = require('request');
var events = require('events');
var eventEmitter = new events.EventEmitter();

/**
 * Initialize database.
 *
 * @param {object} dbConnect
 * @param {string} dbName
 * @param {number} userId
 * @param {string} token
 * @public
 */
exports.init = function(dbConnect, dbName, userId, token) {

  var sqlShowDbLikeName = 'SHOW DATABASES LIKE \'' + dbName + '\';';

  dbConnect.query(sqlShowDbLikeName, initializeDatabase);

  /**
   * Callback for request method 'query'.
   *
   * @param {object} err
   * @param {object} res
   * @private
   */
  function initializeDatabase(err, res) {
    if (err) throw err;

    // create database if not exist
    if (res[0] === undefined) {
      createDatabase(dbConnect, dbName);
      fillDatabase(dbConnect, dbName, userId, token);
    } else {
      var sqlUseDb = 'USE ' + dbName + '; ';
      dbConnect.query(sqlUseDb, dbError);
    }
  }
};

/**
 * Creating database.
 *
 * @param {object} dbConnect
 * @param {string} dbName
 * @private
 */
function createDatabase(dbConnect,dbName) {
  var sqlCreateDb         = 'CREATE SCHEMA ' + dbName + '; ';
  var sqlUseDb            = 'USE ' + dbName + '; ';
  var sqlCreateTableUsers = 'CREATE TABLE users (' +
                            'id_user INT(10) NOT NULL, ' +
                            'photo LONGTEXT, ' +
                            'first_name VARCHAR(20) NOT NULL, ' +
                            'last_name VARCHAR(20) NOT NULL, ' +
                            'PRIMARY KEY(id_user) ' +
                            ') ENGINE=MYISAM DEFAULT CHARSET=utf8; ';
  var sqlCreateTablePosts = 'CREATE TABLE posts (' +
                            'id_post INT(10) NOT NULL AUTO_INCREMENT, ' +
                            'id_author INT(10) NOT NULL, ' +
                            'date VARCHAR(16) NOT NULL, ' +
                            'text TEXT NOT NULL, ' +
                            'PRIMARY KEY(id_post), ' +
                            'FOREIGN KEY(id_author) REFERENCES users (id_user), ' +
                            'FULLTEXT(text) ' +
                            ') ENGINE=MYISAM DEFAULT CHARSET=utf8; ';
  var sql = sqlCreateDb + sqlUseDb + sqlCreateTableUsers + sqlCreateTablePosts;

  dbConnect.query(sql, dbError);
}

/**
 * Filling database.
 *
 * @param {object} dbConnect
 * @param {string} dbName
 * @param {number} userId
 * @param {string} token
 * @private
 */
function fillDatabase(dbConnect, dbName, userId, token) {

  // Reference for request to friends information.
  var href = 'https://api.vk.com/method/execute?' +
             'code=' +
             'return API.users.get({' +
               'user_ids: API.friends.get({user_id:' + userId + '}),' +
               'fields:"photo_50"' +
             '});' +
             '&' +
             'access_token=' +
             token;

  // Fill table users.
  request.get(href, fillTableUsers);

  /**
   * Callback for request method 'get'.
   *
   * @param {object} err
   * @param {object} res
   * @param {string} body [JSON Object]
   * @private
   */
  function fillTableUsers(err, res, body) {
    var data = JSON.parse(body).response;

    var i;
    var j;
    for (i = 0, j = data.length; i < j; i++) {
      var sqlInsertUsers = 'INSERT INTO users ' +
                           'VALUES (' +
                           '\'' + data[i].uid + '\', ' +
                           '\'' + data[i].photo_50 + '\', ' +
                           '\'' + data[i].first_name + '\', ' +
                           '\'' + data[i].last_name + '\'' +
                           '); ';
      dbConnect.query(sqlInsertUsers, dbError);
    }

    eventEmitter.emit('doneDbUsers', data.length);
  }

  // Expected fill table users.
  eventEmitter.on('doneDbUsers', function(numOfFriends) {

    // VK Api give only 24 request at a time. That's mean we can get records
    // from 24 friends. And, if we have more 24 friend, then we must
    // use option offset for VK Api method 'friends.get' and to increase it
    // each time. Reduce request to 15. And will get 20 records. It's optimal.
    var offset;
    for(offset = 0; offset <= numOfFriends; offset += 15) {

      // Reference for request to friends posts.
      var href = 'https://api.vk.com/method/execute?' +
                 'code=' +
                 'var res = []; ' +
                 'var friends = API.friends.get({' +
                   '"user_id":' + userId + ', ' +
                   '"offset": ' + offset +
                 '}); ' +
                 'var wall = []; ' +
                 'var i = 0; ' +
                 'while(i!=15) { ' +
                   'i = i%2b1; ' +
                   'wall = API.wall.get({' +
                     '"owner_id": friends[i], ' +
                     '"count": 20, ' +
                     '"filter": "owner" ' +
                   '}); ' +
                   'if (wall[0]) { ' +
                     'res.push(wall); ' +
                   '}} ' +
                 'return res;&access_token=' +
                 token;

      request.get(href, fillTablePosts);
    }
  });


  /**
   * Callback for request method 'get'.
   *
   * @param {object} err
   * @param {object} res
   * @param {string} body [JSON Object]
   * @private
   */
  function fillTablePosts(err, res, body) {
    var data = JSON.parse(body).response;

    var i;
    var j;
    for (i = 0, j = data.length; i < j; i++) {
      var x;
      var y;
      for (x = 0, y = data[i].length - 1; x < y; x++) {

        // Intercept repost and emty post
        var extra = data[i][x].copy_post_type || !data[i][x].text;

        if (extra) continue;

        var datePost  = formatDate( new Date(data[i][x].date * 1000) );
        var formatText = mysqlRealEscapeString( String(data[i][x].text) );
        var sqlInsertPosts = 'INSERT INTO posts (' +
                             'id_author, ' +
                             'date, ' +
                             'text) ' +
                             'VALUES (' +
                             '\'' + data[i][x].from_id + '\', ' +
                             '\'' + datePost + '\', ' +
                             '\'' + formatText + '\'' +
                             '); ';
        dbConnect.query(sqlInsertPosts, dbError);
      }
    }
  }
}

/**
  * Error callback for mysql query.
  *
  * @param {object} err
  * @private
  */
function dbError(err) {
  if (err) throw err;
}

/**
  * The formatting date.
  *
  * @param {object} date
  * @return {object} [Date like dd.mm.yyyy hh:mm]
  * @private
  */
function formatDate(date) {
  date = [
    '0' + date.getDate(),
    '0' + (date.getMonth() + 1),
    ''  + date.getFullYear(),
    '0' + date.getHours(),
    '0' + date.getMinutes()
  ];

  var i;
  var j;
  for (i = 0, j = date.length; i < j; i++) {
    if (i === 2) continue;
    date[i] = date[i].slice(-2);
  }

  // date equal like ["01", "01", "1970", "00", "00"]
  return date.slice(0, 3).join('.') + ' ' + date.slice(3).join(':');
}

/**
  * The formatting string for mysql.
  *
  * @param {string} str
  * @return {string}
  * @private
  */
function mysqlRealEscapeString(str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                // prepends a backslash to backslash, percent,
                // and double/single quotes
                return "\\"+char;
        }
    });
}
