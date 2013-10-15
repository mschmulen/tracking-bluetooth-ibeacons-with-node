/**
 * Expose `HttpContext`.
 */

module.exports = HttpContext;

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('strong-remoting:http-context')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , SUPPORTED_TYPES = ['json'];

/**
 * Create a new `HttpContext` with the given `options`.
 *
 * @param {Object} options
 * @return {HttpContext}
 */

function HttpContext(req, res, method) {
  this.req = req;
  this.res = res;
  this.method = method;
  this.args = this.buildArgs(method);
  this.methodString = method.stringName;
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(HttpContext, EventEmitter);

/**
 * Build args object from the http context's `req` and `res`.
 */

HttpContext.prototype.buildArgs = function (method) {
  var args = {};
  var accepts = method.accepts;
  var returns = method.returns;

  // build arguments from req and method options
  accepts.forEach(function (o) {
    var httpFormat = o.http;
    var name = o.name || o.arg;

    if(httpFormat) {
      switch(typeof httpFormat) {
        case 'function':
          // the options have defined a formatter
          args[name] = httpFormat(this);
        break;
        case 'object':
          switch(httpFormat.source) {
            case 'body':
              args[name] = this.req.body;
            break;
            case 'form':
            case 'query':
            case 'path':
              args[name] = this.req.params[name];
            break;
            case 'req':
              args[name] = this.req;
            break;
          }
        break;
      }
    } else {
      args[name] = this.getArgByName(name, o);
    }

    // cast booleans and numbers
    var type = typeof args[o.arg];
    var otype = o.type && o.type.toLowerCase();

    if(otype === 'boolean' && type === 'string') {
      args[o.arg] = Boolean(args[o.arg]);
    }

    if(otype === 'number' && type === 'string') {
      args[o.arg] = Number(args[o.arg]);
    }
  }.bind(this));

  return args;
}

/**
 * Get an arg by name using the given options.
 *
 * @param {String} name
 * @param {Object} options **optional**
 */

HttpContext.prototype.getArgByName = function (name, options) {
  var req = this.req;
  var args = req.param('args');

  if(args) {
    args = JSON.parse(args);
  }

  if(typeof args !== 'object' || !args) {
    args = {};
  }

  var arg = (args && args[name]) || this.req.param(name);
  // search these in order by name
  // req.params
  // req.body
  // req.query


  // coerce simple types in objects
  if(typeof arg === 'object') {
    arg = coerceAll(arg);
  }

  return arg;
}

/**
 * Integer test regexp.
 */

var isint = /^[0-9]+$/;

/**
 * Float test regexp.
 */

var isfloat = /^([0-9]+)?\.[0-9]+$/;

function coerce(str) {
  if(typeof str != 'string') return str;
  if ('null' == str) return null;
  if ('true' == str) return true;
  if ('false' == str) return false;
  if (isfloat.test(str)) return parseFloat(str, 10);
  if (isint.test(str)) return parseInt(str, 10);
  return str;
}

// coerce every string in the given object / array
function coerceAll(obj) {
  var type = Array.isArray(obj) ? 'array' : typeof obj;

  switch(type) {
    case 'string':
        return coerce(obj);
    break;
    case 'object':
        Object.keys(obj).forEach(function (key) {
          obj[key] = coerceAll(obj[key]);
        });
    break;
    case 'array':
      obj.map(function (o) {
        return coerceAll(o);
      });
    break;
  }

  return obj;
}

/**
 * Invoke the given shared method using the provided scope against the current context.
 */

HttpContext.prototype.invoke = function (scope, method, fn, isCtor) {
  var args = isCtor ? this.buildArgs(method) : this.args;
  var accepts = method.accepts;
  var returns = method.returns;
  var http = method.http;
  var pipe = http && http.pipe;
  var pipeDest = pipe && pipe.dest;
  var pipeSrc = pipe && pipe.source;

  if(pipeDest) {
    // only support response for now
    switch(pipeDest) {
      case 'res':
          var stream = method.invoke(scope, args, fn);
          stream.pipe(this.res);
        break;
      default:
          fn(new Error('unsupported pipe destination'));
        break;
    }
  } else if(pipeSrc) {
    // only support request for now
    switch(pipeDest) {
      case 'req':
          this.req.pipe(method.invoke(scope, args, fn));
        break;
      default:
          fn(new Error('unsupported pipe source'));
        break;
    }
  } else {
    // simple invoke
    method.invoke(scope, args, fn);
  }
}

/**
 * Finish the request and send the correct response.
 */

HttpContext.prototype.done = function () {
  // send the result back as
  // the requested content type
  var data = this.result;
  var res = this.res;
  var accepts = this.req.accepts(SUPPORTED_TYPES);
  var dataExists = typeof data !== 'undefined';

  if(dataExists) {
    switch(accepts) {
      case 'json':
        if(data === null) {
          res.header('Content-Type', 'application/json');
          res.header('Content-Length', '4');
          res.end('null');
        } else {
          res.json(data);
        }
      break;
      default:
        // not acceptable
        res.send(406);
      break;
    }
  } else {
    res.header('Content-Type', 'application/json');
    res.statusCode = 204;
    res.end();
  }
}
