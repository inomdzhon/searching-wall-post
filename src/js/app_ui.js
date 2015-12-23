'use strict';

var socket = io.connect();

$(document).ready(function() {

  // Send request
  $('.send-request').submit(function() {
    var filterWord = $('.filter-word').val();

    // Removed old request
    $('.frame').empty();
    $('.found').empty();
    socket.emit('find post', filterWord);

    return false;
  });

  socket.on('show', function(posts) {
    $('.found').append('Found records: ' + posts.length);

    var items = [];
    var i;
    var j;
    for (i = 0, j = posts.length; i < j; i++) {
      items[i] = '<tr>' +
                   '<td><img src="' + posts[i].photo      + '"></td>' +
                   '<td>'           + posts[i].first_name +   '</td>' +
                   '<td>'           + posts[i].last_name  +   '</td>' +
                   '<td>'           + posts[i].date       +   '</td>' +
                   '<td>'           + posts[i].text       +   '</td>' +
                 '</tr>';
      $('.frame').append(items[i]);
    }
  });
});