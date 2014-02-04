/**
 * Expose `SocketIOAdapter`.
 */

module.exports = SocketIOAdapter;

/**
 * Module dependencies.
 */
 
var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('strong-remoting:socket-io-adapter')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , express = require('express')
  , SocketIOContext = require('./socket-io-context');
  
/**
 * Create a new `RestAdapter` with the given `options`.
 *
 * @param {Object} options
 * @return {RestAdapter}
 */

function SocketIOAdapter(remotes, server) {
  EventEmitter.apply(this, arguments);
  
  // throw an error if args are not supplied
  // assert(typeof options === 'object', 'RestAdapter requires an options object');
  
  this.remotes = remotes;
  this.server = server;
  this.Context = SocketIOContext;
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(SocketIOAdapter, EventEmitter);

/*!
 * Simplified APIs
 */

SocketIOAdapter.create = function (remotes) {
  // add simplified construction / sugar here
  return new SocketIOAdapter(remotes);
}

SocketIOAdapter.prototype.createHandler = function () {
  var adapter = this;
  var remotes = this.remotes;
  var Context = this.Context;
  var classes = this.remotes.classes();
  var io = require('socket.io').listen(this.server);

  io.sockets.on('connection', function (socket) {
    socket.on('invoke', function (methodString, ctorArgs, args, id) {
      var method = remotes.findMethod(methodString);
      
      if(method) {
        // create context NEED ARGS
        var ctx = new Context(socket.request, ctorArgs, args);
      
        adapter.invoke(ctx, method, args, function (err, result) {
          socket.emit('result', {
            data: result,
            id: id,
            methodString: methodString,
            __types__: method.returns
          });
        });
      } else {
        socket.emit('result', {
          err: 'method does not exist',
          id: id,
          methodString: methodString
        });
      }
    });
  });
}

SocketIOAdapter.prototype.invoke = function (ctx, method, args, callback) {
  var remotes = this.remotes;
  
  if(method.isStatic) {
    remotes.execHooks('before', method, method.ctor, ctx, function (err) {
      if(err) return callback(err);
    
      // invoke the static method on the actual constructor
      ctx.invoke(method.ctor, method, function (err, result) {
        if(err) return callback(err);
        ctx.result = result;
        remotes.execHooks('after', method, method.ctor, ctx, function (err) {
          // send the result
          callback(err, ctx.result);
        });
      });
    });
  } else {
    // invoke the shared constructor to get an instance
    ctx.invoke(method, method.sharedCtor, function (err, inst) {
      if(err) return callback(err);
      remotes.execHooks('before', method, inst, ctx, function (err) {
        if(err) {
          callback(err);
        } else {
          // invoke the instance method
          ctx.invoke(inst, method, function (err, result) {
            if(err) return callback(err);
          
            ctx.result = result;
            remotes.execHooks('after', method, inst, ctx, function (err) {
              // send the result
              callback(err, ctx.result);
            });
          });
        }
      });
    });
  }
}