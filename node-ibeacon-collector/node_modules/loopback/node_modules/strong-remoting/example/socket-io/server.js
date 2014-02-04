// create a set of shared classes
var remotes = require('../../').create();

// share some fs module code
var fs = remotes.exports.fs = require('fs');

// specifically the readFile function
fs.readFile.shared = true;

// describe the arguments
fs.readFile.accepts = {arg: 'path', type: 'string'};

// describe the result
fs.readFile.returns = {arg: 'data', type: 'buffer'};

// event emitter
var EventEmitter = require('events').EventEmitter
var ee = remotes.exports.ee = new EventEmitter();

// expose the on method
ee.on.shared = true;
ee.on.accepts = {arg: 'event', type: 'string'};
ee.on.returns = {arg: 'data', type: 'object'};

setInterval(function() {
  // emit some data
  ee.emit('foo', {some: 'data'});
}, 1000);

// expose it over http
var server =
require('http')
  .createServer()
  .listen(3000);
  
remotes.handler('socket-io', server);